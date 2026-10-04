import type {Member} from "@/models/Group.ts";

export const TOTAL_PERCENTAGE = 100;

export function roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
}

/** Suma de los porcentajes de los miembros (los que no tienen porcentaje cuentan como 0). */
export function sumPercentages(members: ReadonlyArray<Pick<Member, "percentage">>): number {
    return roundToTwoDecimals(members.reduce((total, member) => total + (member.percentage ?? 0), 0));
}

/** Cuánto le falta al grupo para llegar a 100 (negativo si se pasa). */
export function getPercentageDifference(members: ReadonlyArray<Pick<Member, "percentage">>): number {
    return roundToTwoDecimals(TOTAL_PERCENTAGE - sumPercentages(members));
}

/** El máximo que puede tener un miembro sin que la suma de los activos supere 100. */
export function getMaxPercentageFor(members: ReadonlyArray<Member>, memberId: number): number {
    const othersSum = sumPercentages(members.filter((member) => member.id !== memberId));
    return Math.max(0, roundToTwoDecimals(TOTAL_PERCENTAGE - othersSum));
}
