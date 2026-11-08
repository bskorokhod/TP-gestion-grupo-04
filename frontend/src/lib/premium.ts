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
