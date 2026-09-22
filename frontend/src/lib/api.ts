export interface ApiError extends Error {
    data: string
    status: number
    statusText: string
}

/** Devuelve el status HTTP de un error lanzado por `fetchApi`, o null si no es un error HTTP. */
export function getApiErrorStatus(error: unknown): number | null {
    if (typeof error === "object" && error !== null && "status" in error) {
        const status = (error as { status: unknown }).status;
        return typeof status === "number" ? status : null;
    }
    return null;
}

export async function fetchApi(url: string, options: RequestInit = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        let errorData: { message: string };
        const contentType = response.headers.get('content-type');

        try {
            if (contentType?.includes('application/json')) {
                errorData = await response.json();
            } else {
                errorData = { message: await response.text() };
            }
        } catch {
            errorData = {
                message: `Error: ${response.status} ${response.statusText}`
            };
        }

        const error = new Error(errorData.message || `HTTP ${response.status}`);
        Object.assign(error, {
            data: errorData,
            status: response.status,
            statusText: response.statusText,
            url
        });

        throw error;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}