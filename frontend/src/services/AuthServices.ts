import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

import {
    AuthResponse,
    AuthResponseSchema,
    LoginRequest,
    UserCreate,
    UserCreateSchema,
} from "@/models/User";
import { useToken } from "@/contexts/TokenContext.tsx";
import { ApiService } from "@/services/ApiServices";

const HOME_ROUTE = "/";
const GROUPS_ROUTE = "/grupos";

async function auth(
    method: "PUT" | "POST",
    endpoint: string,
    data: object,
): Promise<AuthResponse> {
    const response = await ApiService.request<AuthResponse>(endpoint, {
        method,
        body: JSON.stringify(data),
    });
    return AuthResponseSchema.parse(response);
}

export function useLogin() {
    const [, setToken] = useToken();
    const [, navigate] = useLocation();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (req: LoginRequest): Promise<void> => {
            const tokens = await auth("POST", "/sessions", req);
            setToken({ state: "LOGGED_IN", tokens });
        },
        onSuccess: async (): Promise<void> => {
            await qc.resetQueries();
            navigate(GROUPS_ROUTE);
        },
    });
}

export function useRefresh() {
    const [tokenState, setToken] = useToken();

    return useMutation({
        mutationFn: async (): Promise<AuthResponse> => {
            if (tokenState.state !== "LOGGED_IN") {
                throw new Error("Cannot refresh without being logged in");
            }

            const { refreshToken } = tokenState.tokens;
            const tokenPromise = auth("PUT", "/sessions", { refreshToken });
            setToken({ state: "REFRESHING", tokenPromise });

            try {
                const newTokens = await tokenPromise;
                setToken({ state: "LOGGED_IN", tokens: newTokens });
                return newTokens;
            } catch (err) {
                setToken({ state: "LOGGED_OUT" });
                throw err;
            }
        },
    });
}

export function useSignup() {
    const [, setToken] = useToken();
    const [, navigate] = useLocation();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (req: UserCreate): Promise<void> => {
            const parsed = UserCreateSchema.parse(req);
            const tokens = await auth("POST", "/users", parsed);
            setToken({ state: "LOGGED_IN", tokens });
        },
        onSuccess: async (): Promise<void> => {
            await qc.resetQueries();
            navigate(GROUPS_ROUTE);
        },
    });
}

export function useLogout(): () => void {
    const [, setToken] = useToken();
    const [, navigate] = useLocation();

    return function logOut(): void {
        setToken({ state: "LOGGED_OUT" });
        navigate(HOME_ROUTE);
    };
}