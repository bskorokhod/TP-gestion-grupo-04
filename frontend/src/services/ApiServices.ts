import { BASE_API_URL } from "@/config/app-query-client";
import { fetchApi } from "@/lib/api";

export class ApiService {
    private static jsonHeaders = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };

    private static refreshHandler: (() => Promise<void>) | null = null;

    static setRefreshHandler(handler: () => Promise<void>): void {
        this.refreshHandler = handler;
    }

    static async request<T = unknown>(
        endpoint: string,
        options: RequestInit = {}
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
        options: RequestInit = {}
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

        const result = await tryRequest().catch(async (error: unknown) => {
            const hasStatus = (err: unknown): err is { status: number } =>
                typeof err === 'object' && err !== null && 'status' in err;

            const status = hasStatus(error) ? error.status : null;
            const isAuthError = status === 401 || status === 403;

            if (isAuthError && this.refreshHandler) {
                await this.refreshHandler();
                return await tryRequest();
            }

            return Promise.reject(error);
        });

        return result;
    }

    static get<T = unknown>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "GET" });
    }

    static post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    static put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    static patch<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    static delete<T = unknown>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }
}