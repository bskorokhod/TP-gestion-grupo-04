const API_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
    } catch {
        throw new Error("No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.");
    }

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