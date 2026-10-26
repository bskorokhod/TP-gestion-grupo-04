export const currency: Intl.NumberFormat = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
    return currency.format(amount);
}

export const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const MONTHS_FULL = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Fecha corta del historial, por ejemplo "05 mar 2026". */
export function formatDate(iso: string): string {
    const date = new Date(iso);
    const day = String(date.getDate()).padStart(2, "0");
    return `${day} ${MONTHS_SHORT[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
}

export const amount: Intl.NumberFormat = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
});

export function formatAmount(value: number): string {
    return Number.isFinite(value) ? amount.format(value) : "";
}

/** Redondea a centavos para evitar ruido de punto flotante al restar montos (por ejemplo 2733.34 - 2733). */
export function roundCents(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Convierte lo que escribe la persona en un monto con hasta 2 decimales; NaN si no es válido.
 * Acepta notación argentina ("2.733,50" = 2733.5) y punto decimal ("0.34" = 0.34). Reglas:
 * - si hay coma, es el separador decimal y los puntos son de miles;
 * - si no hay coma y el punto va seguido de exactamente 3 dígitos ("2.733", "1.500.000"), es separador de miles;
 * - en cualquier otro caso, el punto es decimal.
 */
export function parseAmount(value: string): number {
    const cleaned = value.replace(/[\s$]/g, "");
    if (cleaned === "") return NaN;

    let normalized: string;
    if (cleaned.includes(",")) {
        normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        normalized = cleaned.replace(/\./g, "");
    } else {
        normalized = cleaned;
    }

    if (!/^(\d+\.?\d*|\.\d+)$/.test(normalized)) return NaN;
    const decimals = normalized.split(".")[1] ?? "";
    if (decimals.length > 2) return NaN;
    return Number(normalized);
}
