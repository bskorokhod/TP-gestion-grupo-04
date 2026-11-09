import { BASE_API_URL } from "@/config/app-query-client";
import { fetchApi, getApiErrorStatus } from "@/lib/api";

export class ApiService {
    private static readonly jsonHeaders: Readonly<Record<string, string>> = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };

    /**
     * Renueva la sesión y devuelve el access token nuevo. Lo registra el `TokenProvider`; debe compartir un único
     * refresh en curso entre varios 401 simultáneos y pasar a LOGGED_OUT si falla.
     */
    private static refreshHandler: (() => Promise<string>) | null = null;

    static setRefreshHandler(handler: (() => Promise<string>) | null): void {
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
        const tryRequest = async (token?: string): Promise<T> => {
            const accessToken = token ?? await getAccessToken();
            return this.request<T>(endpoint, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        };

        try {
            return await tryRequest();
        } catch (error: unknown) {
            // Solo el 401 (token vencido o inválido) renueva la sesión; un 403 es "no tenés permiso" y no se reintenta.
            // Se reintenta una sola vez, con el token nuevo; si el refresh falla se informa el 401 original.
            if (getApiErrorStatus(error) === 401 && this.refreshHandler) {
                let newToken: string;
                try {
                    newToken = await this.refreshHandler();
                } catch {
                    throw error;
                }
                return tryRequest(newToken);
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