const DAY_MS = 86_400_000;

const RELATIVE_TIME_UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
    { unit: "year", ms: 365 * DAY_MS },
    { unit: "month", ms: 30 * DAY_MS },
    { unit: "week", ms: 7 * DAY_MS },
    { unit: "day", ms: DAY_MS },
    { unit: "hour", ms: 60 * 60 * 1000 },
    { unit: "minute", ms: 60 * 1000 },
];

const relativeTimeFormatter = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

/** Si `deadline` ya pasó respecto de `now` (false si no hay plazo conocido). */
export function isOverdue(deadline: string | null | undefined, now: Date = new Date()): boolean {
    if (!deadline) return false;
    return now.getTime() > new Date(deadline).getTime();
}

/** Hace cuánto pasó `dateIso` respecto de `now`, en palabras ("hace 2 semanas"); asume que ya pasó. */
export function formatElapsedSince(dateIso: string, now: Date = new Date()): string {
    const elapsedMs = now.getTime() - new Date(dateIso).getTime();
    for (const { unit, ms } of RELATIVE_TIME_UNITS) {
        if (elapsedMs >= ms) {
            return relativeTimeFormatter.format(-Math.floor(elapsedMs / ms), unit);
        }
    }
    return relativeTimeFormatter.format(0, "minute");
}

/** Fecha y hora de un vencimiento, igual al formato que ya usan las tarjetas de votación ("20 nov, 15:30"). */
export function formatDeadline(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

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
