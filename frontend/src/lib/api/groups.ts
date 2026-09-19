const API_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || `Error ${res.status} al procesar la solicitud`);
    }

    return res.json();
}

export function createGroup(name: string) {
    return request<{ id: string; name: string }>("/groups", {
        method: "POST",
        body: JSON.stringify({ name }),
    });
}

export function joinGroup(code: string) {
    return request<{ id: string; name: string }>("/groups/join", {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}