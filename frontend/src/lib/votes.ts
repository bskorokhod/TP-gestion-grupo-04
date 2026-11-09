import { describeFailureReason } from "@/constants/votes.ts";
import type { Vote } from "@/models/Vote.ts";

/**
 * Un gasto es extraordinario si su monto alcanza el umbral del grupo (mayor o igual), igual que en el
 * backend. Se compara en centavos para no depender del redondeo de los flotantes.
 */
export function reachesExtraordinaryThreshold(amount: number, threshold: number): boolean {
    return Math.round(amount * 100) >= Math.round(threshold * 100);
}

const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export interface ResolvedVoteMessage {
    readonly kind: "success" | "failure";
    readonly title: string;
    readonly description: string;
}

/** Qué decirle al usuario cuando su acción cerró una votación; null si la votación sigue activa. */
export function describeResolvedVote(vote: Vote): ResolvedVoteMessage | null {
    if (vote.status !== "FINALIZED") return null;

    switch (vote.outcome) {
        case "APPROVED":
            return {
                kind: "success",
                title: "Votación aprobada",
                description: "La propuesta alcanzó los votos necesarios y ya se aplicó.",
            };
        case "EXECUTION_FAILED":
            return {
                kind: "failure",
                title: "No se pudo aplicar la propuesta",
                description: `Se aprobó, pero ya no es posible aplicarla: ${lowerFirst(describeFailureReason(vote.failureReason))}.`,
            };
        default:
            return {
                kind: "failure",
                title: "Votación rechazada",
                description: "La propuesta no alcanzó los votos necesarios y no se aplicó.",
            };
    }
}
