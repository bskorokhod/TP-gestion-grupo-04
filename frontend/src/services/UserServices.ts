import { useMutation } from "@tanstack/react-query";

import { BASE_API_URL } from "@/config/app-query-client";
import { AuthResponseSchema, LoginRequest, SignupRequest } from "@/models/Login";
import { useToken } from "@/services/TokenContext";

export function useLogin() {
  const [, setToken] = useToken();

  return useMutation({
    mutationFn: async (req: LoginRequest) => {
      const tokens = await auth("POST", "/sessions", req);
      setToken({ state: "LOGGED_IN", tokens });
    },
  });
}

export function useRefresh() {
  const [tokenState, setToken] = useToken();

  return useMutation({
    mutationFn: async () => {
      if (tokenState.state !== "LOGGED_IN") {
        return;
      }

      try {
        const refreshToken = tokenState.tokens.refreshToken;
        const tokenPromise = auth("PUT", "/sessions", { refreshToken });
        setToken({ state: "REFRESHING", tokenPromise });
        setToken({ state: "LOGGED_IN", tokens: await tokenPromise });
      } catch (err) {
        setToken({ state: "LOGGED_OUT" });
        throw err;
      }
    },
  });
}

export function useSignup() {
  const [, setToken] = useToken();

  return useMutation({
    mutationFn: async (req: SignupRequest) => {
      const tokens = await auth("POST", "/users", req);
      setToken({ state: "LOGGED_IN", tokens });
    },
  });
}

async function auth(method: "PUT" | "POST", endpoint: string, data: object) {
  const response = await fetch(BASE_API_URL + endpoint, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return AuthResponseSchema.parse(await response.json());
  } else {
    throw new Error(`Failed with status ${response.status}: ${await response.text()}`);
  }
}
