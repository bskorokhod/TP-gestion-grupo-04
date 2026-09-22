export const currency: Intl.NumberFormat = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
    return currency.format(amount);
}