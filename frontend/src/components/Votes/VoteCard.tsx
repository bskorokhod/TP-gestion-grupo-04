import type { ReactElement, ReactNode } from "react";

import Button from "@/components/Button.tsx";
import { Avatar } from "@/components/ui/Avatar.tsx";
import { useFormToasts } from "@/hooks/useFormToasts.ts";
import type { BackendError } from "@/hooks/useToast.ts";
import { formatCurrency } from "@/lib/format.ts";
import { describeResolvedVote } from "@/lib/votes.ts";
import type { ExpenseMember, SplitMethod } from "@/models/Expense.ts";
import type { DistributionMode, ReservationLimitPolicy, VotingModel } from "@/models/Group.ts";
import type { ConfigChange, ConfigSetting, ProposedExpense, Vote, VoteChoice } from "@/models/Vote.ts";
import { useCastBallot } from "@/services/VoteServices.ts";

const VOTING_MODEL_LABEL: Record<VotingModel, string> = {
    SIMPLE_MAJORITY: "Mayoría simple",
    OWNERSHIP_WEIGHTED_MAJORITY: "Mayoría ponderada por propiedad",
    UNANIMOUS: "Unanimidad",
};

const SPLIT_METHOD_LABEL: Record<SplitMethod, string> = {
    EQUAL: "Partes iguales",
    PROPORTIONAL: "Según porcentaje de propiedad",
    CUSTOM: "Porcentajes personalizados",
};

function MemberChip({ member, suffix }: { member: ExpenseMember; suffix?: string }): ReactElement {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-muted py-1 pl-1 pr-3 text-sm">
            <Avatar name={member.nickname} color={member.color} photoUrl={member.photoUrl} size="sm" />
            <span className="font-medium">{member.nickname}</span>
            {suffix ? <span className="text-ink-soft">{suffix}</span> : null}
        </span>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }): ReactElement {
    return (
        <div className="space-y-1">
            <dt className="text-xs font-medium uppercase text-brand">{label}</dt>
            <dd className="flex flex-wrap gap-2 text-sm font-semibold">{children}</dd>
        </div>
    );
}

/** Lo que se está votando en un gasto extraordinario: los datos del gasto que se crearía. */
function ExpenseProposalDetails({ proposal }: { proposal: ProposedExpense }): ReactElement {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-black">{proposal.title}</h3>
                <p className="text-sm text-ink-soft">{proposal.description?.trim() || "Sin descripción"}</p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Monto">{formatCurrency(proposal.totalAmount)}</Detail>
                <Detail label="Reparto">{SPLIT_METHOD_LABEL[proposal.splitMethod]}</Detail>
                <Detail label="A cargo (a quien se le debe)">
                    <MemberChip member={proposal.creditor} />
                </Detail>
                <Detail label="Asignado a">
                    {proposal.participants.length === 0 ? (
                        <span className="text-ink-soft">Nadie más: lo cubre quien está a cargo</span>
                    ) : (
                        proposal.participants.map((participant) => (
                            <MemberChip
                                key={participant.member.id}
                                member={participant.member}
                                suffix={participant.customPercentage != null ? `${participant.customPercentage}%` : undefined}
                            />
                        ))
                    )}
                </Detail>
            </dl>

            {proposal.receiptUrl ? (
                <a
                    href={proposal.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-sm font-medium text-primary underline underline-offset-4"
                >
                    Ver comprobante
                </a>
            ) : null}
        </div>
    );
}

const CONFIG_SETTING_LABEL: Record<ConfigSetting, string> = {
    DISTRIBUTION_MODE: "Modo de repartición del bien",
    VOTING_MODEL: "Modo de aprobación de votación",
    RESERVATION_LIMIT_POLICY: "Restricción de reservas",
    EXTRAORDINARY_EXPENSE_THRESHOLD: "Monto de gasto extraordinario",
};

const DISTRIBUTION_MODE_LABEL: Record<DistributionMode, string> = {
    EQUAL: "Equitativo (partes iguales)",
    PERCENTAGE: "Porcentual (según % de propiedad)",
};

const RESERVATION_POLICY_LABEL: Record<ReservationLimitPolicy, string> = {
    EQUAL: "Equitativo",
    OWNERSHIP_PROPORTIONAL: "Proporcional al % de propiedad",
    FIXED_DAYS_PER_MONTH: "Cantidad fija de días por mes",
};

function describeProposedValue(change: ConfigChange): string {
    switch (change.setting) {
        case "DISTRIBUTION_MODE":
            return change.distributionMode ? DISTRIBUTION_MODE_LABEL[change.distributionMode] : "-";
        case "VOTING_MODEL":
            return change.votingModel ? VOTING_MODEL_LABEL[change.votingModel] : "-";
        case "RESERVATION_LIMIT_POLICY": {
            if (!change.reservationLimitPolicy) return "-";
            const label = RESERVATION_POLICY_LABEL[change.reservationLimitPolicy];
            return change.reservationFixedDaysPerMonth != null
                ? `${label}: ${change.reservationFixedDaysPerMonth} días`
                : label;
        }
        case "EXTRAORDINARY_EXPENSE_THRESHOLD":
            return change.extraordinaryExpenseThreshold != null
                ? formatCurrency(change.extraordinaryExpenseThreshold)
                : "-";
    }
}

/** Lo que se está votando en un cambio de configuración: qué ajuste cambia y a qué valor. */
function ConfigChangeDetails({ change }: { change: ConfigChange }): ReactElement {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-black">Cambio de configuración</h3>
                <p className="text-sm text-ink-soft">Requiere la aprobación unánime de los miembros del grupo.</p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Configuración">{CONFIG_SETTING_LABEL[change.setting]}</Detail>
                <Detail label="Nuevo valor">{describeProposedValue(change)}</Detail>
            </dl>
        </div>
    );
}

function ProgressBar({ vote }: { vote: Vote }): ReactElement {
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
                {progress.yes} a favor · {progress.no} en contra · {progress.pending} sin votar
                {" — "}
                {VOTING_MODEL_LABEL[vote.votingModel]}
            </p>
        </div>
    );
}

export interface VoteCardProps {
    readonly vote: Vote;
    readonly groupId: number;
}

export function VoteCard({ vote, groupId }: VoteCardProps): ReactElement {
    const castBallot = useCastBallot(groupId);
    const { showApiError, showSuccessToast, showErrorToast } = useFormToasts();

    const handleVote = async (choice: VoteChoice): Promise<void> => {
        if (choice === vote.myChoice || castBallot.isPending) return;

        try {
            const updated = await castBallot.mutateAsync({ voteId: vote.id, choice });
            const resolution = describeResolvedVote(updated);

            if (!resolution) {
                showSuccessToast("Voto registrado", choice === "YES" ? "Votaste a favor." : "Votaste en contra.");
            } else if (resolution.kind === "success") {
                showSuccessToast(resolution.title, resolution.description);
            } else {
                showErrorToast(resolution.title, resolution.description);
            }
        } catch (error) {
            showApiError(error as BackendError, "No se pudo registrar tu voto");
        }
    };

    const createdAt = new Date(vote.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

    return (
        <article className="space-y-5 rounded-3xl bg-panel p-6 text-foreground shadow-panel">
            {vote.expenseProposal ? (
                <ExpenseProposalDetails proposal={vote.expenseProposal} />
            ) : vote.configChange ? (
                <ConfigChangeDetails change={vote.configChange} />
            ) : (
                <p className="text-sm text-ink-soft">El detalle de esta votación todavía no está disponible.</p>
            )}

            <ProgressBar vote={vote} />

            <footer className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-soft">
                    Propuesto por <strong>{vote.proposer.nickname}</strong> el {createdAt}
                </p>

                {vote.canVote ? (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={vote.myChoice === "NO" ? "muted" : "success"}
                            aria-pressed={vote.myChoice === "YES"}
                            disabled={castBallot.isPending}
                            onClick={() => void handleVote("YES")}
                        >
                            A favor
                        </Button>
                        <Button
                            type="button"
                            variant={vote.myChoice === "YES" ? "muted" : "danger"}
                            aria-pressed={vote.myChoice === "NO"}
                            disabled={castBallot.isPending}
                            onClick={() => void handleVote("NO")}
                        >
                            En contra
                        </Button>
                    </div>
                ) : (
                    <p className="text-xs text-ink-soft">No participás de esta votación.</p>
                )}
            </footer>
        </article>
    );
}
