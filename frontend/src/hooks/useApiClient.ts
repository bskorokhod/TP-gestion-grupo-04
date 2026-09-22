import { useMemo } from "react";

import { useAccessTokenGetter } from "@/contexts/TokenContext.tsx";
import { ApiService } from "@/services/ApiServices.ts";

export interface ApiClient {
    get<T = unknown>(endpoint: string): Promise<T>;
    post<T = unknown>(endpoint: string, data?: unknown): Promise<T>;
    put<T = unknown>(endpoint: string, data?: unknown): Promise<T>;
    patch<T = unknown>(endpoint: string, data?: unknown): Promise<T>;
    del<T = unknown>(endpoint: string): Promise<T>;
}

function toBody(data: unknown): string | undefined {
    return data === undefined ? undefined : JSON.stringify(data);
}

export function useApiClient(): ApiClient {
    const getAccessToken = useAccessTokenGetter();

    return useMemo<ApiClient>(() => ({
        get: <T = unknown,>(endpoint: string): Promise<T> =>
            ApiService.authenticatedRequest<T>(getAccessToken, endpoint, {
                method: "GET",
            }),

        post: <T = unknown,>(endpoint: string, data?: unknown): Promise<T> =>
            ApiService.authenticatedRequest<T>(getAccessToken, endpoint, {
                method: "POST",
                body: toBody(data),
            }),

        put: <T = unknown,>(endpoint: string, data?: unknown): Promise<T> =>
            ApiService.authenticatedRequest<T>(getAccessToken, endpoint, {
                method: "PUT",
                body: toBody(data),
            }),

        patch: <T = unknown,>(endpoint: string, data?: unknown): Promise<T> =>
            ApiService.authenticatedRequest<T>(getAccessToken, endpoint, {
                method: "PATCH",
                body: toBody(data),
            }),

        del: <T = unknown,>(endpoint: string): Promise<T> =>
            ApiService.authenticatedRequest<T>(getAccessToken, endpoint, {
                method: "DELETE",
            }),
    }), [getAccessToken]);
}