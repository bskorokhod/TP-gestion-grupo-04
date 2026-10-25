export const currency: Intl.NumberFormat = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
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
