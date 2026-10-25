export const currency: Intl.NumberFormat = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
    return currency.format(amount);
}

export const amount: Intl.NumberFormat = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
});

export function formatAmount(value: number): string {
    return Number.isFinite(value) ? amount.format(value) : "";
}

export function parseAmount(value: string): number {
    const digits = value.replace(/\D/g, "");
    return digits === "" ? NaN : Number(digits);
}
