import type { ReactElement } from "react";

import { ConfigChangeDetails, ExpenseProposalDetails, ExpenseReportDetails, ReservationClaimDetails,} from "@/components/Votes/VoteCard.tsx";
import { VOTING_MODEL_LABEL } from "@/constants/config_modals.ts";
import type { FinishedVote, VoteType } from "@/models/Vote.ts";

const TYPE_LABEL: Record<VoteType, string> = {
    EXTRAORDINARY_EXPENSE: "Gasto extraordinario",
    EXPENSE_REPORT: "Reporte de gasto",
    RESERVATION_CLAIM: "Reclamo de reserva",
    CONFIG_CHANGE: "Cambio de configuración",
};

interface ResultBadge {
    readonly label: string;
    readonly className: string;
}

/** Quién ganó, y si lo que ganó llegó a aplicarse. `result` null es una votación cerrada sin que el conteo la resolviera. */
function describeResult(vote: FinishedVote): ResultBadge {
    if (vote.result === "IN_FAVOR") {
        return vote.outcome === "EXECUTION_FAILED"
            ? { label: "Ganó a favor · no se pudo aplicar", className: "text-group-amber" }
            : { label: "Ganó a favor", className: "text-group-green" };
    }
    if (vote.result === "AGAINST") {
        return { label: "Ganó en contra", className: "text-group-danger" };
    }
    return { label: "Cerrada sin resultado", className: "text-ink-soft" };
}

function formatDay(value: string): string {
    return new Date(value).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function FinishedProgress({ vote }: { vote: FinishedVote }): ReactElement {
    const { progress } = vote;
    const total = progress.yesWeight + progress.noWeight + progress.pendingWeight;
    const yesPercent = total > 0 ? (progress.yesWeight / total) * 100 : 0;
    const noPercent = total > 0 ? (progress.noWeight / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="bg-group-green" style={{ width: `${yesPercent}%` }} />
                <div className="bg-group-danger" style={{ width: `${noPercent}%` }} />
            </div>
            <p className="text-xs text-ink-soft">
                {progress.yes} a favor · {progress.no} en contra
                {progress.pending > 0 ? ` · ${progress.pending} sin votar` : ""}
                {" — "}
                {VOTING_MODEL_LABEL[vote.votingModel]}
            </p>
        </div>
    );
}

export interface FinishedVoteCardProps {
    readonly vote: FinishedVote;
}

/**
 * TODO(vote): falta la screen del historial que lo muestra.
 *
 * Votación finalizada, como la activa pero estática: sin botones ni nada que se pueda modificar. Muestra lo que se votó,
 * el conteo y el criterio con el que se votó, y el resultado definitivo.
 */
export function FinishedVoteCard({ vote }: FinishedVoteCardProps): ReactElement {
    const result = describeResult(vote);

    return (
        <article className="space-y-5 rounded-3xl bg-panel p-6 text-foreground shadow-panel">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase text-brand">{TYPE_LABEL[vote.type]}</span>
                <span className={`rounded-full bg-muted px-3 py-1 text-xs font-bold ${result.className}`}>
                    {result.label}
                </span>
            </header>

            {vote.expenseProposal ? (
                <ExpenseProposalDetails proposal={vote.expenseProposal} />
            ) : vote.configChange ? (
                <ConfigChangeDetails change={vote.configChange} />
            ) : vote.expenseReport ? (
                <ExpenseReportDetails report={vote.expenseReport} showConsequences={false} />
            ) : vote.reservationClaim ? (
                <ReservationClaimDetails claim={vote.reservationClaim} />
            ) : (
                <p className="text-sm text-ink-soft">El detalle de esta votación no está disponible.</p>
            )}

            {vote.failureReason ? <p className="text-xs text-ink-soft">{vote.failureReason}</p> : null}

            <FinishedProgress vote={vote} />

            <footer>
                <p className="text-xs text-ink-soft">
                    {vote.type === "RESERVATION_CLAIM" ? "Reclamado por" : "Propuesto por"}{" "}
                    <strong>{vote.proposer.nickname}</strong> el {formatDay(vote.createdAt)} · cerrada el{" "}
                    {formatDay(vote.finalizedAt)}
                </p>
            </footer>
        </article>
    );
}
