import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    UserProfile,
    UserProfileSchema,
    UserPhotoUpdate,
    UserPhotoUpdateSchema,
    Email,
    EmailSchema,
    AuthResponse,
    AuthResponseSchema,
} from "@/models/User";
import { useApiClient } from "@/hooks/useApiClient";
import { useToken } from "@/contexts/TokenContext.tsx";

export function useGetUserProfile() {
    const api = useApiClient();
    return useQuery({
        queryKey: ["userProfile"] as const,
        queryFn: async (): Promise<UserProfile> => {
            const data = await api.get<{ results: unknown }>("/users/profile");
            return UserProfileSchema.parse(data.results);
        },
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function useUpdateRole() {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<void, Error, { username: string }>({
        mutationFn: async ({ username }): Promise<void> =>
            api.patch<void>(`/users/${username}`),
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useUpdatePhoto() {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<void, Error, { newUrl: UserPhotoUpdate }>({
        mutationFn: async ({ newUrl }): Promise<void> => {
            const parsed = UserPhotoUpdateSchema.parse(newUrl);
            return api.patch<void>("/users/profile", parsed);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["userProfile"] });
        },
    });
}

/**
 * El email es el identificador de login: el backend reemite accessToken/refreshToken en la misma
 * respuesta (igual que login/signup/refresh) para que la sesión actual no quede con un token viejo.
 * Por eso actualiza el TokenContext acá mismo en vez de dejar que el próximo 401 lo resuelva solo.
 */
export function useUpdateEmail() {
    const api = useApiClient();
    const [, setToken] = useToken();
    const qc = useQueryClient();

    return useMutation<AuthResponse, Error, Email>({
        mutationFn: async (req): Promise<AuthResponse> => {
            const parsed = EmailSchema.parse(req);
            const data = await api.patch("/users/profile/email", parsed);
            return AuthResponseSchema.parse(data);
        },
        onSuccess: (tokens): void => {
            setToken({ state: "LOGGED_IN", tokens });
            void qc.invalidateQueries({ queryKey: ["userProfile"] });
        },
    });
}