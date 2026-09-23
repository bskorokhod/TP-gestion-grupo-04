import {ReactNode, useState} from "react";
import {Link, useLocation} from "wouter";
import {MemberInfoCard} from "@/components/AdminCard";
import Button from "@/components/Button.tsx";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {cn} from "@/lib/cn.ts";
import {can} from "@/lib/permissions.ts";
import type {Member} from "@/models/Group.ts";
import {useApproveJoinRequest, useGetGroupMembers, useGetPendingMembers, useRejectJoinRequest } from "@/services/GroupServices.ts";
import {toast} from "@/hooks/useToast.ts";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faCalendarDays, faPercent, faLink, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import {Avatar} from "@/components/ui/Avatar.tsx";

interface SettingItem {
    readonly icon: ReactNode;
    readonly title: string;
    readonly description: string;
    readonly target: string;
    readonly disabled?: boolean;
}
const SETTINGS: ReadonlyArray<SettingItem> = [
    {
        icon: <FontAwesomeIcon icon={faPercent} className="h-5 w-5" aria-hidden />,
        title: "Configurar porcentajes de propiedad",
        description:
            "Definí qué porcentaje del bien le corresponde a cada integrante del grupo y ajustá la distribución cuando cambie.",
        target: "porcentajes",
        disabled: false,
    },
    {
        icon: <FontAwesomeIcon icon={faCalendarDays} className="h-5 w-5" aria-hidden />,
        title: "Configurar reservas",
        description:
            "Establecé reglas de uso: máximo de días por persona, anticipación mínima y cómo se resuelven los conflictos de fechas.",
        target: "#",
        disabled: true,
    },
];

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
        <div className="grid grid-cols-3 gap-8 justify-between items-start self-stretch py-4">
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

export const ConfigurationScreen = () => {
    const [location] = useLocation();
    const group = useCurrentGroup();
    const [copied, setCopied] = useState(false);

    const canReviewJoinRequests = can(group, "reviewJoinRequests");
    const canConfigure = can(group, "editPercentages");

    const configBasePath = location.replace(/\/$/, "");

    async function handleCopyJoinCode() {
        await copyToClipboard(group.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <CommonLayout>
            <GroupNavbar>
                {canReviewJoinRequests && (
                    <Button
                        size="lg"
                        variant="modalSecondary"
                        onClick={handleCopyJoinCode}
                        aria-label="Copiar código de invitación al portapapeles"
                        className="inline-flex items-center gap-2"
                    >
                        {copied ? (
                            "¡Código copiado!"
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faLink} className="h-4 w-4" aria-hidden />
                                Compartir código de unión
                            </>
                        )}
                    </Button>
                )}
            </GroupNavbar>

            <div className="flex flex-col flex-1 gap-3 items-start w-full bg-background pt-14 px-30 pb-16 overflow-hidden">
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
                            {SETTINGS.map((setting) =>
                                setting.disabled ? (
                                    <div
                                        key={setting.title}
                                        aria-disabled="true"
                                        className="flex flex-row justify-between items-center self-stretch bg-panel rounded-4xl border border-field/50 py-6 px-7 overflow-hidden opacity-40 cursor-not-allowed"
                                    >
                                        <div className="flex flex-row gap-5 items-center">
                                            <div className="flex flex-row justify-center items-center w-12 h-12 bg-brand/15 rounded-[14px] overflow-hidden shrink-0">
                                                <p className="text-lg font-semibold text-brand">
                                                    {setting.icon}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1 items-start w-140">
                                                <p className="text-lg font-semibold text-ink">
                                                    {setting.title}
                                                </p>
                                                <p className="text-base font-normal text-warm-muted">
                                                    {setting.description}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-base font-medium text-warm-muted">
                                            Próximamente
                                        </p>
                                    </div>
                                ) : (
                                    <Link
                                        key={setting.title}
                                        href={`${configBasePath}/porcentajes`}
                                        className="flex flex-row justify-between items-center self-stretch bg-panel rounded-4xl border border-field/50 py-6 px-7 overflow-hidden text-left"
                                    >
                                        <div className="flex flex-row gap-5 items-center">
                                            <div className="flex flex-row justify-center items-center w-12 h-12 bg-brand/15 rounded-[14px] overflow-hidden shrink-0">
                                                <p className="text-lg font-semibold text-brand">
                                                    {setting.icon}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1 items-start w-140">
                                                <p className="text-lg font-semibold text-ink">
                                                    {setting.title}
                                                </p>
                                                <p className="text-base font-normal text-warm-muted">
                                                    {setting.description}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-semibold text-brand">
                                            <FontAwesomeIcon icon={faArrowRight} aria-hidden />
                                        </p>
                                    </Link>
                                ),
                            )}
                        </div>

                    </>
                ) : (
                    <p className="pt-2 text-base text-warm-muted">
                        Solo el fundador y los administradores del grupo pueden modificar
                        esta configuración.
                    </p>
                )}
            </div>
        </CommonLayout>
    );
};
