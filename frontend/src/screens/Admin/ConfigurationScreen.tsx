import { useState } from "react";
import { Link, useLocation } from "wouter";

import { MemberInfoCard } from "@/components/AdminCard";
import Button from "@/components/Button.tsx";
import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { cn } from "@/lib/cn.ts";
import { can } from "@/lib/permissions.ts";
import { MEMBERS } from "@/models/User";
import type { Member } from "@/models/Group.ts";
import {
    useApproveJoinRequest,
    useGetPendingMembers,
    useRejectJoinRequest,
} from "@/services/GroupServices.ts";
import { toast } from "@/hooks/useToast.ts";

export interface Page {
    readonly id: string;
    readonly label: string;
}

interface SettingItem {
    readonly icon: string;
    readonly title: string;
    readonly description: string;
    readonly target: string;
}

const SETTINGS: ReadonlyArray<SettingItem> = [
    {
        icon: "%",
        title: "Configurar porcentajes de propiedad",
        description:
            "Definí qué porcentaje del bien le corresponde a cada integrante del grupo y ajustá la distribución cuando cambie.",
        target: "porcentajes",
    },
    {
        icon: "📅",
        title: "Configurar reservas",
        description:
            "Establecé reglas de uso: máximo de días por persona, anticipación mínima y cómo se resuelven los conflictos de fechas.",
        target: "#",
    },
];

// Color de avatar según el enum MemberColor del backend.
const MEMBER_COLOR_CLASS: Record<string, string> = {
    RED: "bg-custom-red",
    BLUE: "bg-custom-me",
    GREEN: "bg-custom-green",
    YELLOW: "bg-group-amber",
    ORANGE: "bg-custom-orange",
    PURPLE: "bg-custom-lilac",
    PINK: "bg-custom-red",
    LIGHT_BLUE: "bg-custom-me",
};

function memberColorClass(color: string): string {
    return MEMBER_COLOR_CLASS[color] ?? "bg-custom-lilac";
}

interface JoinRequestItemProps {
    readonly member: Member;
    readonly selected: boolean;
    readonly onToggle: (id: number) => void;
}

function JoinRequestItem({ member, selected, onToggle }: JoinRequestItemProps) {
    const initial = member.nickname.charAt(0).toUpperCase();

    return (
        <button
            type="button"
            onClick={() => onToggle(member.id)}
            aria-pressed={selected}
            className={cn(
                "flex flex-row items-center gap-4 self-stretch rounded-2xl border px-6 py-4 text-left transition-colors",
                selected
                    ? "border-brand bg-brand/8"
                    : "border-field/50 bg-panel hover:border-brand/40"
            )}
        >
            {/* Checkbox visual */}
            <div
                className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    selected ? "border-brand bg-brand" : "border-field"
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

            {/* Avatar */}
            <div
                className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    memberColorClass(member.color)
                )}
            >
                <span className="text-base font-semibold text-panel">{initial}</span>
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-col">
                <p className="text-base font-semibold text-ink">{member.nickname}</p>
                <p className="text-sm text-warm-muted">@{member.username}</p>
            </div>

            {/* Fecha de solicitud */}
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

    // Procesa las mutaciones en secuencia. Al primer 409 (solicitud ya resuelta) aborta
    // y notifica; el estado en el servidor ya cambió para las anteriores, así que
    // refrescamos la query de todas formas.
    async function runSequential(
        ids: number[],
        mutate: (id: number) => Promise<unknown>,
        errorPrefix: string
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
                // Invalidar la query para reflejar el estado real (las anteriores sí se procesaron)
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
            "No se pudo aceptar la solicitud"
        );

        setIsBatchPending(false);
        setSelectedIds(new Set());

        if (allSucceeded) {
            // Navegar a porcentajes para redistribuir incluyendo a los nuevos miembros
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
            "No se pudo rechazar la solicitud"
        );

        setIsBatchPending(false);
        setSelectedIds(new Set());

        if (allSucceeded) {
            toast({
                title: `${ids.length === 1 ? "Solicitud rechazada" : `${ids.length} solicitudes rechazadas`}`,
                description: "Las solicitudes seleccionadas fueron denegadas.",
            });
        }
    }

    if (pendingQuery.isLoading) {
        return (
            <p role="status" className="text-sm text-warm-muted">
                Cargando solicitudes pendientes...
            </p>
        );
    }

    if (pendingQuery.isError) {
        return (
            <p role="alert" className="text-sm font-medium text-group-danger">
                No se pudieron cargar las solicitudes de ingreso.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4 items-start self-stretch pt-2">
            {pendingMembers.length === 0 ? (
                <p className="text-base text-warm-muted">
                    No hay solicitudes de ingreso pendientes.
                </p>
            ) : (
                <>
                    {/* Encabezado de lista con "seleccionar todos" */}
                    <div className="flex flex-row items-center justify-between self-stretch">
                        <p className="text-sm font-medium text-warm-muted">
                            {pendingMembers.length}{" "}
                            {pendingMembers.length === 1 ? "solicitud pendiente" : "solicitudes pendientes"}
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

                    {/* Lista de solicitudes */}
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

                    {/* Acciones batch */}
                    <div className="flex flex-row gap-3 items-center self-stretch justify-end pt-1">
                        <p
                            className={cn(
                                "text-sm text-warm-muted mr-auto transition-opacity",
                                hasSelection ? "opacity-100" : "opacity-0 pointer-events-none"
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

export const ConfigurationScreen = () => {
    const [location] = useLocation();
    const group = useCurrentGroup();

    const canReviewJoinRequests = can(group, "reviewJoinRequests");
    const canConfigure = can(group, "editPercentages");

    // Base path de configuración sin trailing slash: /grupos/ABC-1234-XYZ/configuracion
    const configBasePath = location.replace(/\/$/, "");

    return (
        <CommonLayout>
            <GroupNavbar>
                {canReviewJoinRequests && (
                    <Button size="xl2" variant="modalSecondary">
                        Agregar miembro
                    </Button>
                )}
            </GroupNavbar>

            <div className="flex flex-col flex-1 gap-3 items-start w-full bg-background pt-14 px-30 pb-16 overflow-hidden">
                <p className="text-3xl font-extrabold text-brand-hover">
                    Miembros y porcentajes de propiedad
                </p>

                <div className="grid grid-cols-3 gap-8 justify-between items-start self-stretch py-4">
                    {MEMBERS.map((member) => (
                        <MemberInfoCard key={member.id} member={member} />
                    ))}
                </div>

                {canConfigure ? (
                    <>
                        <p className="text-3xl font-extrabold text-brand-hover">
                            Ajustes disponibles
                        </p>

                        <div className="flex flex-col gap-4 items-start self-stretch pt-2 overflow-hidden">
                            {SETTINGS.map((setting) => (
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
                                    <p className="text-lg font-semibold text-brand">→</p>
                                </Link>
                            ))}
                        </div>

                        {/* Sección de solicitudes de ingreso */}
                        <p className="text-3xl font-extrabold text-brand-hover mt-4">
                            Solicitudes de ingreso
                        </p>

                        <JoinRequestsSection
                            groupId={group.id}
                            configBasePath={configBasePath}
                        />
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
