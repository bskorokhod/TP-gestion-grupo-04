import {ReactNode, useState} from "react";
import {Link, useLocation} from "wouter";
import {MemberInfoCard} from "@/components/AdminCard";
import Button from "@/components/Button.tsx";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {cn} from "@/lib/cn.ts";
import type {GroupSettings, Member} from "@/models/Group.ts";
import {useApproveJoinRequest, useGetGroupMembers, useGetPendingMembers, useRejectJoinRequest } from "@/services/GroupServices.ts";
import {toast, type BackendError} from "@/hooks/useToast.ts";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import {describeResolvedVote} from "@/lib/votes.ts";
import type {ConfigChangeCreate} from "@/models/Vote.ts";
import {useCreateConfigChangeVote} from "@/services/VoteServices.ts";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faPercent,
    faCopy,
    faArrowRight,
    faPenToSquare,
    faCheckToSlot,
    faCalendarCheck,
    faCoins,
    faChartPie,
} from "@fortawesome/free-solid-svg-icons";
import {Avatar} from "@/components/ui/Avatar.tsx";
import {
    ConfigChangeModal,
    type ConfigChangeKind,
    type ConfigChangeRequest,
} from "@/components/modals/ConfigChangeModal.tsx";

const MODIFY_CONFIG_LABEL = "Solicitar modificación de configuración";
const MODIFY_PERCENTAGES_LABEL = "Modificar porcentajes";

// Única fila que navega a otra pantalla en lugar de abrir un modal.
const PERCENTAGES_SETTING = {
    icon: <FontAwesomeIcon icon={faPercent} className="h-5 w-5" aria-hidden />,
    title: "Configurar porcentajes de propiedad",
    description:
        "Definí qué porcentaje del bien le corresponde a cada integrante del grupo y ajustá la distribución cuando cambie.",
} as const;

interface ModalSettingItem {
    readonly kind: ConfigChangeKind;
    readonly icon: ReactNode;
    readonly title: string;
    readonly description: string;
    readonly currentValue: (settings: GroupSettings) => string;
}

const VOTING_VALUE_LABELS: Record<GroupSettings["votingModel"], string> = {
    SIMPLE_MAJORITY: "Mayoría simple",
    OWNERSHIP_WEIGHTED_MAJORITY: "Mayoría proporcional",
    UNANIMOUS: "Unánime",
};

const DISTRIBUTION_VALUE_LABELS: Record<GroupSettings["distributionMode"], string> = {
    EQUAL: "Equitativo",
    PERCENTAGE: "Porcentual",
};

function reservationValue(settings: GroupSettings): string {
    switch (settings.reservationLimitPolicy) {
        case "EQUAL":
            return "Equitativo";
        case "OWNERSHIP_PROPORTIONAL":
            return "Proporcional";
        case "FIXED_DAYS_PER_MONTH":
            return `${settings.reservationFixedDaysPerMonth ?? "-"} días por mes`;
    }
}

const MODAL_SETTINGS: ReadonlyArray<ModalSettingItem> = [
    {
        kind: "voting",
        icon: <FontAwesomeIcon icon={faCheckToSlot} className="h-5 w-5" aria-hidden />,
        title: "Modo de aprobación de votación",
        description:
            "Definí cómo se aprueban las votaciones: mayoría simple, mayoría proporcional al porcentaje de propiedad o unanimidad.",
        currentValue: (settings) => VOTING_VALUE_LABELS[settings.votingModel],
    },
    {
        kind: "reservation",
        icon: <FontAwesomeIcon icon={faCalendarCheck} className="h-5 w-5" aria-hidden />,
        title: "Restricciones de reservas",
        description:
            "Establecé cuántos días por mes puede reservar el bien cada miembro: equitativo, proporcional al porcentaje o una cantidad fija.",
        currentValue: reservationValue,
    },
    {
        kind: "threshold",
        icon: <FontAwesomeIcon icon={faCoins} className="h-5 w-5" aria-hidden />,
        title: "Monto de gasto extraordinario",
        description:
            "Monto a partir del cual un gasto se considera extraordinario y debe aprobarse por votación.",
        currentValue: (settings) =>
            `$ ${settings.extraordinaryExpenseThreshold.toLocaleString("es-AR")}`,
    },
    {
        kind: "distribution",
        icon: <FontAwesomeIcon icon={faChartPie} className="h-5 w-5" aria-hidden />,
        title: "Modo de repartición del bien",
        description:
            "Definí si el bien se reparte en partes iguales entre los miembros o según el porcentaje de cada uno.",
        currentValue: (settings) => DISTRIBUTION_VALUE_LABELS[settings.distributionMode],
    },
];

interface ModalSettingRowProps {
    readonly item: ModalSettingItem;
    readonly settings: GroupSettings;
    readonly onRequestChange: (kind: ConfigChangeKind) => void;
}

function ModalSettingRow({ item, settings, onRequestChange }: ModalSettingRowProps) {
    return (
        <div className="flex flex-row justify-between items-center gap-6 self-stretch bg-panel rounded-4xl border border-field/50 py-6 px-7 overflow-hidden text-left">
            <div className="flex flex-row gap-5 items-center">
                <div className="flex flex-row justify-center items-center w-12 h-12 bg-brand/15 rounded-[14px] overflow-hidden shrink-0">
                    <p className="text-lg font-semibold text-brand">{item.icon}</p>
                </div>
                <div className="flex flex-col gap-1 items-start max-w-140">
                    <p className="text-lg font-semibold text-ink">{item.title}</p>
                    <p className="text-base font-normal text-warm-muted">{item.description}</p>
                </div>
            </div>
            <div className="flex flex-row gap-5 items-center shrink-0">
                <p className="text-2xl font-extrabold text-brand-hover">
                    {item.currentValue(settings)}
                </p>
                <Button
                    type="button"
                    variant="danger"
                    size="icon"
                    title={MODIFY_CONFIG_LABEL}
                    aria-label={`${MODIFY_CONFIG_LABEL}: ${item.title}`}
                    onClick={() => onRequestChange(item.kind)}
                >
                    <FontAwesomeIcon icon={faPenToSquare} aria-hidden />
                </Button>
            </div>
        </div>
    );
}

// ─── Sección: Miembros ───────────────────────────────────────────────────────

interface MembersSectionProps {
    readonly groupId: number;
}

function MembersSection({ groupId }: MembersSectionProps) {
    const membersQuery = useGetGroupMembers(groupId, "ACTIVE");

    if (membersQuery.isLoading) {
        return (
            <p role="status" className="text-base text-warm-muted py-4">
                Cargando miembros...
            </p>
        );
    }

    if (membersQuery.isError) {
        return (
            <p role="alert" className="text-base font-medium text-group-danger py-4">
                No se pudieron cargar los miembros del grupo.
            </p>
        );
    }

    const members = membersQuery.data ?? [];

    if (members.length === 0) {
        return (
            <p className="text-base text-warm-muted py-4">
                El grupo aún no tiene miembros activos.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8 justify-between items-start self-stretch py-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
                <MemberInfoCard key={member.id} member={member} />
            ))}
        </div>
    );
}

// ─── Sección: Solicitudes de ingreso ────────────────────────────────────────

interface JoinRequestItemProps {
    readonly member: Member;
    readonly selected: boolean;
    readonly onToggle: (id: number) => void;
}

function JoinRequestItem({ member, selected, onToggle }: JoinRequestItemProps) {
    return (
        <button
            type="button"
            onClick={() => onToggle(member.id)}
            aria-pressed={selected}
            className={cn(
                "flex flex-row items-center gap-4 self-stretch rounded-2xl border px-6 py-4 text-left transition-colors",
                selected
                    ? "border-brand bg-brand/8"
                    : "border-field/50 bg-panel hover:border-brand/40",
            )}
        >
            <div
                className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    selected ? "border-brand bg-brand" : "border-field",
                )}
                aria-hidden="true"
            >
                {selected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                            d="M1 4l3 3 5-6"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </div>

            <Avatar size="lg" color={member.color} name={member.nickname} photoUrl={member.photoUrl}/>

            <div className="flex min-w-0 flex-col">
                <p className="text-base font-semibold text-ink">{member.nickname}</p>
                <p className="text-sm text-warm-muted">{member.username}</p>
            </div>

            {member.requestedAt && (
                <p className="ml-auto shrink-0 text-sm text-warm-muted">
                    {new Date(member.requestedAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })}
                </p>
            )}
        </button>
    );
}

interface JoinRequestsSectionProps {
    readonly groupId: number;
    readonly configBasePath: string;
}

function JoinRequestsSection({ groupId, configBasePath }: JoinRequestsSectionProps) {
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(new Set());
    const [isBatchPending, setIsBatchPending] = useState(false);

    const pendingQuery = useGetPendingMembers(groupId);
    const approveMutation = useApproveJoinRequest(groupId);
    const rejectMutation = useRejectJoinRequest(groupId);

    const [, navigate] = useLocation();

    const pendingMembers = pendingQuery.data ?? [];
    const hasSelection = selectedIds.size > 0;

    function toggleSelection(memberId: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(memberId)) {
                next.delete(memberId);
            } else {
                next.add(memberId);
            }
            return next;
        });
    }

    function toggleAll() {
        if (selectedIds.size === pendingMembers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingMembers.map((m) => m.id)));
        }
    }

    async function runSequential(
        ids: number[],
        mutate: (id: number) => Promise<unknown>,
        errorPrefix: string,
    ): Promise<boolean> {
        for (const id of ids) {
            try {
                await mutate(id);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Error desconocido";
                toast({
                    variant: "destructive",
                    title: `${errorPrefix}: operación abortada`,
                    description: message,
                });
                await pendingQuery.refetch();
                return false;
            }
        }
        return true;
    }

    async function handleApprove() {
        if (!hasSelection || isBatchPending) return;
        setIsBatchPending(true);
        const ids = [...selectedIds];
        const allSucceeded = await runSequential(
            ids,
            (id) => approveMutation.mutateAsync(id),
            "No se pudo aceptar la solicitud",
        );
        setIsBatchPending(false);
        setSelectedIds(new Set());
        if (allSucceeded) {
            navigate(`${configBasePath}/porcentajes`);
        }
    }

    async function handleReject() {
        if (!hasSelection || isBatchPending) return;
        setIsBatchPending(true);
        const ids = [...selectedIds];
        const allSucceeded = await runSequential(
            ids,
            (id) => rejectMutation.mutateAsync(id),
            "No se pudo rechazar la solicitud",
        );
        setIsBatchPending(false);
        setSelectedIds(new Set());
        if (allSucceeded) {
            toast({
                title:
                    ids.length === 1
                        ? "Solicitud rechazada"
                        : `${ids.length} solicitudes rechazadas`,
                description: "Las solicitudes seleccionadas fueron denegadas.",
            });
        }
    }

    if (pendingQuery.isLoading) {
        return (
            <p role="status" className="text-sm text-warm-muted mb-8">
                Cargando solicitudes pendientes...
            </p>
        );
    }

    if (pendingQuery.isError) {
        return (
            <p role="alert" className="text-sm font-medium text-group-danger mb-8">
                No se pudieron cargar las solicitudes de ingreso.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4 items-start self-stretch pt-2">
            {pendingMembers.length === 0 ? (
                <p className="text-base text-warm-muted mb-8">
                    No hay solicitudes de ingreso pendientes.
                </p>
            ) : (
                <>
                    <div className="flex flex-row items-center justify-between self-stretch">
                        <p className="text-sm font-medium text-warm-muted">
                            {pendingMembers.length}{" "}
                            {pendingMembers.length === 1
                                ? "solicitud pendiente"
                                : "solicitudes pendientes"}
                        </p>
                        <button
                            type="button"
                            onClick={toggleAll}
                            disabled={isBatchPending}
                            className="text-sm font-medium text-brand hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {selectedIds.size === pendingMembers.length
                                ? "Deseleccionar todas"
                                : "Seleccionar todas"}
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 self-stretch">
                        {pendingMembers.map((member) => (
                            <JoinRequestItem
                                key={member.id}
                                member={member}
                                selected={selectedIds.has(member.id)}
                                onToggle={toggleSelection}
                            />
                        ))}
                    </div>

                    <div className="flex flex-row gap-3 items-center self-stretch justify-end pt-1">
                        <p
                            className={cn(
                                "text-sm text-warm-muted mr-auto transition-opacity",
                                hasSelection ? "opacity-100" : "opacity-0 pointer-events-none",
                            )}
                        >
                            {selectedIds.size}{" "}
                            {selectedIds.size === 1 ? "seleccionada" : "seleccionadas"}
                        </p>

                        <Button
                            type="button"
                            variant="danger"
                            size="default"
                            disabled={!hasSelection || isBatchPending}
                            onClick={handleReject}
                        >
                            {isBatchPending && rejectMutation.isPending
                                ? "Rechazando..."
                                : "Rechazar"}
                        </Button>

                        <Button
                            type="button"
                            variant="success"
                            size="default"
                            disabled={!hasSelection || isBatchPending}
                            onClick={handleApprove}
                        >
                            {isBatchPending && approveMutation.isPending
                                ? "Aceptando..."
                                : "Aceptar"}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Screen principal ────────────────────────────────────────────────────────

async function copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
}

interface JoinCodeShareProps {
    readonly joinCode: string;
}

function JoinCodeShare({ joinCode }: JoinCodeShareProps) {
    async function handleCopy() {
        try {
            await copyToClipboard(joinCode);
            toast({ title: "Código copiado al portapapeles" });
        } catch {
            toast({
                variant: "destructive",
                title: "No se pudo copiar el código",
                description: `Copialo manualmente: ${joinCode}`,
            });
        }
    }

    return (
        <div className="flex flex-col items-start gap-1.5 md:items-end">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-foreground/70">
                Código de grupo
            </span>

            <div className="inline-flex items-center gap-1 rounded-full border border-modal-border bg-modal-surface py-1 pl-5 pr-1 shadow-none">
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={`Copiar código de grupo ${joinCode} al portapapeles`}
                    title="Copiar al portapapeles"
                    className="cursor-pointer text-lg font-bold tracking-widest tabular-nums text-modal-ink transition-colors hover:text-modal-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md"
                >
                    {joinCode}
                </button>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copiar código de grupo al portapapeles"
                    title="Copiar al portapapeles"
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-modal-primary transition-colors hover:bg-modal-field focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    <FontAwesomeIcon icon={faCopy} className="h-4 w-4" aria-hidden />
                </button>
            </div>

            <span className="max-w-64 text-xs text-brand-foreground/70 md:text-right">
                Compartí este código para que otros se unan al grupo.
            </span>
        </div>
    );
}

/** Traduce lo que entrega el modal al cuerpo que espera el backend: `setting` y solo el nuevo valor. */
function toConfigChangeBody(request: ConfigChangeRequest): ConfigChangeCreate {
    switch (request.kind) {
        case "voting":
            return { setting: "VOTING_MODEL", votingModel: request.votingModel };
        case "distribution":
            return { setting: "DISTRIBUTION_MODE", distributionMode: request.distributionMode };
        case "reservation":
            return {
                setting: "RESERVATION_LIMIT_POLICY",
                reservationLimitPolicy: request.reservationLimitPolicy,
                reservationFixedDaysPerMonth: request.reservationFixedDaysPerMonth,
            };
        case "threshold":
            return {
                setting: "EXTRAORDINARY_EXPENSE_THRESHOLD",
                extraordinaryExpenseThreshold: request.extraordinaryExpenseThreshold,
            };
    }
}

export const ConfigurationScreen = () => {
    const [location] = useLocation();
    const group = useCurrentGroup();
    const [pendingChange, setPendingChange] = useState<ConfigChangeKind | null>(null);
    const createConfigChange = useCreateConfigChangeVote(group.id);
    const { showApiError, showSuccessToast, showErrorToast } = useFormToasts();

    async function handleConfigChangeSubmit(request: ConfigChangeRequest) {
        try {
            const vote = await createConfigChange.mutateAsync(toConfigChangeBody(request));
            setPendingChange(null);

            // Con un único miembro activo la votación se resuelve en el acto.
            const resolution = describeResolvedVote(vote);
            if (!resolution) {
                showSuccessToast(
                    "Solicitud de modificación enviada",
                    "Los demás miembros del grupo deben aprobarla por votación unánime.",
                );
            } else if (resolution.kind === "success") {
                showSuccessToast(resolution.title, resolution.description);
            } else {
                showErrorToast(resolution.title, resolution.description);
            }
        } catch (error) {
            // El modal queda abierto para poder corregir el valor y reintentar.
            showApiError(error as BackendError, "No se pudo enviar la solicitud");
        }
    }

    const canReviewJoinRequests = group.myStatus === "ACTIVE";
    const canConfigure = group.myStatus === "ACTIVE";

    const configBasePath = location.replace(/\/$/, "");

    return (
        <CommonLayout>
            <GroupNavbar>
                {canReviewJoinRequests && (
                    <JoinCodeShare joinCode={group.joinCode} />
                )}
            </GroupNavbar>

            <div className="flex flex-col flex-1 gap-3 items-start w-full bg-background pt-14 px-6 pb-16 overflow-hidden sm:px-12 lg:px-30">
                <p className="text-3xl font-extrabold text-brand-hover">
                    Miembros y porcentajes de propiedad
                </p>

                <MembersSection groupId={group.id} />

                {canConfigure ? (
                    <>
                        <p className="text-3xl font-extrabold text-brand-hover mt-4">
                        Solicitudes de ingreso
                        </p>

                        <JoinRequestsSection
                            groupId={group.id}
                            configBasePath={configBasePath}
                        />

                        <p className="text-3xl font-extrabold text-brand-hover">
                            Ajustes disponibles
                        </p>

                        <div className="flex flex-col gap-4 items-start self-stretch pt-2 overflow-hidden">
                            <Link
                                href={`${configBasePath}/porcentajes`}
                                className="flex flex-row justify-between items-center gap-6 self-stretch bg-panel rounded-4xl border border-field/50 py-6 px-7 overflow-hidden text-left"
                            >
                                <div className="flex flex-row gap-5 items-center">
                                    <div className="flex flex-row justify-center items-center w-12 h-12 bg-brand/15 rounded-[14px] overflow-hidden shrink-0">
                                        <p className="text-lg font-semibold text-brand">
                                            {PERCENTAGES_SETTING.icon}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 items-start max-w-140">
                                        <p className="text-lg font-semibold text-ink">
                                            {PERCENTAGES_SETTING.title}
                                        </p>
                                        <p className="text-base font-normal text-warm-muted">
                                            {PERCENTAGES_SETTING.description}
                                        </p>
                                    </div>
                                </div>
                                {/* Un <button> dentro de un <a> es HTML inválido: se replica el estilo del Button danger. */}
                                <span
                                    title={MODIFY_PERCENTAGES_LABEL}
                                    aria-label={MODIFY_PERCENTAGES_LABEL}
                                    className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-group-danger text-panel text-xl transition-colors hover:bg-group-danger-soft hover:text-group-danger"
                                >
                                    <FontAwesomeIcon icon={faArrowRight} aria-hidden />
                                </span>
                            </Link>

                            {MODAL_SETTINGS.map((item) => (
                                <ModalSettingRow
                                    key={item.kind}
                                    item={item}
                                    settings={group.settings}
                                    onRequestChange={setPendingChange}
                                />
                            ))}
                        </div>

                    </>
                ) : (
                    <p className="pt-2 text-base text-warm-muted">
                        Solo el fundador y los administradores del grupo pueden modificar
                        esta configuración.
                    </p>
                )}
            </div>

            {pendingChange && (
                <ConfigChangeModal
                    kind={pendingChange}
                    settings={group.settings}
                    onClose={() => setPendingChange(null)}
                    onSubmit={handleConfigChangeSubmit}
                />
            )}
        </CommonLayout>
    );
};
