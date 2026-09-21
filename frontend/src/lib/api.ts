export interface ApiError extends Error {
    data: string
    status: number
    statusText: string
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