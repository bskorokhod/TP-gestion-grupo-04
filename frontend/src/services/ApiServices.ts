import { BASE_API_URL } from "@/config/app-query-client";
import { fetchApi } from "@/lib/api";

export class ApiService {
    private static readonly jsonHeaders: Readonly<Record<string, string>> = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };

    private static refreshHandler: (() => Promise<void>) | null = null;

    static setRefreshHandler(handler: () => Promise<void>): void {
        this.refreshHandler = handler;
    }

    static async request<T = unknown>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const url = `${BASE_API_URL}${endpoint}`;
        return fetchApi(url, {
            ...options,
            headers: {
                ...this.jsonHeaders,
                ...options.headers,
            },
        });
    }

    static async authenticatedRequest<T = unknown>(
        getAccessToken: () => Promise<string>,
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const tryRequest = async (): Promise<T> => {
            const token = await getAccessToken();
            return this.request<T>(endpoint, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                },
            });
        };

        try {
            return await tryRequest();
        } catch (error: unknown) {
            const status: number | null =
                typeof error === "object" && error !== null && "status" in error
                    ? typeof (error as { status: unknown }).status === "number"
                        ? ((error as { status: number }).status)
                        : null
                    : null;

            const isAuthError = status === 401 || status === 403;

            if (isAuthError && this.refreshHandler) {
                await this.refreshHandler();
                return tryRequest();
            }
            throw error;
        }
    }

    static get<T = unknown>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "GET" });
    }

    static post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: data === undefined ? undefined : JSON.stringify(data),
        });
    }

    static put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: data === undefined ? undefined : JSON.stringify(data),
        });
    }

    static patch<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: data === undefined ? undefined : JSON.stringify(data),
        });
    }

    static delete<T = unknown>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }
}