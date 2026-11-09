import { getApiErrorStatus } from "@/lib/api.ts";

/** Texto en español por status HTTP. El mensaje del backend (en inglés) nunca se muestra al usuario. */
export const API_ERROR_MESSAGES: Readonly<Record<number, string>> = {
    400: "Los datos enviados no son válidos. Revisalos e intentá de nuevo.",
    401: "Tu sesión venció. Volvé a iniciar sesión.",
    403: "No tenés permiso para hacer esto.",
    404: "No encontramos lo que buscás.",
    409: "La operación no se pudo completar porque el estado cambió o no está permitida en este momento.",
};

/** Códigos estables que el backend agrega al cuerpo del error (`code`); tienen prioridad sobre el status. */
export const ERROR_CODE_MESSAGES: Readonly<Record<string, string>> = {
    ALREADY_MEMBER_OR_PENDING: "Ya pertenecés a este grupo o tenés una solicitud pendiente.",
    JOIN_PERCENTAGE_NOT_AVAILABLE: "El porcentaje que pediste no es válido o no está disponible en este grupo. Probá con otro.",
    JOIN_PERCENTAGE_REQUIRED: "Ingresá el porcentaje de propiedad que querés tener.",
    DEBTS_UNSETTLED: "Tenés deudas sin saldar. Saldalas antes de abandonar el grupo.",
    JOIN_REQUEST_NOT_PENDING: "Esta solicitud ya fue resuelta.",
    NOT_ACTIVE_MEMBER: "Ya no sos un miembro activo de este grupo.",
    NICKNAME_NOT_AVAILABLE: "Ese apodo no está disponible en este grupo. Elegí otro.",
    GROUP_STOPPED: "El grupo está detenido hasta que los porcentajes sumen 100%.",
};

/** 5xx, error de red o cualquier status sin texto propio. */
export const UNEXPECTED_ERROR_MESSAGE = "Ocurrió un error inesperado. Probá de nuevo en unos minutos.";

export const UPLOAD_ERROR_MESSAGE = "No se pudo subir el archivo. Probá de nuevo.";

/** Falló la subida de un archivo a Supabase (comprobante o foto). No guarda el mensaje crudo de Supabase. */
export class UploadError extends Error {
    constructor() {
        super(UPLOAD_ERROR_MESSAGE);
        this.name = "UploadError";
    }
}

/** Textos específicos de un sitio, por código de error o por status; pisan al mapa común. */
export type ApiErrorOverrides = Readonly<Partial<Record<string | number, string>>>;

/** Status HTTP de un error de `fetchApi` o de uno con forma `{ response: { status } }`; null si no es un error HTTP. */
export function apiErrorStatus(error: unknown): number | null {
    const direct = getApiErrorStatus(error);
    if (direct !== null) return direct;
    if (typeof error === "object" && error !== null && "response" in error) {
        const status = (error as { response?: { status?: unknown } }).response?.status;
        return typeof status === "number" ? status : null;
    }
    return null;
}

/** `code` del cuerpo del error del backend, si lo trae (de `fetchApi` o con forma `{ response: { data: { code } } }`). */
export function apiErrorCode(error: unknown): string | null {
    if (typeof error !== "object" || error === null) return null;
    const candidates = [
        (error as { data?: unknown }).data,
        (error as { response?: { data?: unknown } }).response?.data,
    ];
    for (const data of candidates) {
        if (typeof data === "object" && data !== null) {
            const code = (data as { code?: unknown }).code;
            if (typeof code === "string" && code.length > 0) return code;
        }
    }
    return null;
}

/** Prioridad: override por código > mapa por código > override por status > mapa por status > genérico. */
export function apiErrorMessage(error: unknown, overrides: ApiErrorOverrides = {}): string {
    if (error instanceof UploadError) return UPLOAD_ERROR_MESSAGE;
    const code = apiErrorCode(error);
    if (code !== null) {
        const byCode = overrides[code] ?? ERROR_CODE_MESSAGES[code];
        if (byCode) return byCode;
    }
    const status = apiErrorStatus(error);
    if (status === null) return UNEXPECTED_ERROR_MESSAGE;
    return overrides[status] ?? API_ERROR_MESSAGES[status] ?? UNEXPECTED_ERROR_MESSAGE;
}
