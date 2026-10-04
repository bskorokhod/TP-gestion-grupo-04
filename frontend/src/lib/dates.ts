const DAY_MS = 86_400_000;

/** Fechas como "YYYY-MM-DD" en hora local (el formato que usa el backend para reservas). */
export function dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseDate(value: string): Date {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = {day: "numeric", month: "short"}): string {
    return parseDate(value).toLocaleDateString("es-AR", options);
}

export function tomorrowKey(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateKey(tomorrow);
}

export function monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Cantidad de días entre dos fechas, ambas incluidas. */
export function daysBetween(start: string, end: string): number {
    return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY_MS) + 1;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    return aStart <= bEnd && bStart <= aEnd;
}
