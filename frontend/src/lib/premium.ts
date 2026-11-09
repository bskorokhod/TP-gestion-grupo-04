/**
 * Qué se le puede prometer al usuario sobre la prueba gratuita de premium. El backend la otorga una vez por usuario y
 * una vez por grupo (`GET /groups/{id}/premium/eligibility`); mientras no se sabe o si la consulta falla no se promete
 * nada.
 */
export type TrialOffer = "checking" | "available" | "unavailable" | "unknown";

export function getTrialOffer(eligibility: {
    isError: boolean;
    data?: { trialAvailable: boolean };
}): TrialOffer {
    if (eligibility.data) return eligibility.data.trialAvailable ? "available" : "unavailable";
    return eligibility.isError ? "unknown" : "checking";
}

/** Texto del tiempo que falta a partir de los días completos: "menos de 1 día", "1 día" o "N días". */
export function formatDaysLeft(days: number): string {
    if (days <= 0) return "menos de 1 día";
    return days === 1 ? "1 día" : `${days} días`;
}

export const PREMIUM_GROUP_DRAFT_STORAGE_KEY = "esnuestro-premium-group-draft";

export function savePremiumGroupDraft(group: GroupCreate): void {
    sessionStorage.setItem(PREMIUM_GROUP_DRAFT_STORAGE_KEY, JSON.stringify(group));
}

export function readPremiumGroupDraft(): GroupCreate | null {
    const raw = sessionStorage.getItem(PREMIUM_GROUP_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as GroupCreate;
    } catch {
        sessionStorage.removeItem(PREMIUM_GROUP_DRAFT_STORAGE_KEY);
        return null;
    }
}

export function clearPremiumGroupDraft(): void {
    sessionStorage.removeItem(PREMIUM_GROUP_DRAFT_STORAGE_KEY);
}
import type {GroupCreate} from "@/models/Group.ts";
