import GroupAction from "@/components/GroupAction.tsx";
import GroupCard, {
    type GroupCardIcon,
    type GroupCardProps,
} from "@/components/GroupCard.tsx";
import { Link } from "wouter";
import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { useState } from "react";
import { CreateGroupModal, JoinGroupModal } from "@/components/modals";
import {
    useCreateGroup,
    useGetGroups,
    useGetMyJoinRequests,
    useJoinGroup,
    useMyPendingApprovals,
} from "@/services/GroupServices.ts";
import type { Group, GroupCreate, JoinGroup } from "@/models/Group.ts";
import { useFormToasts } from "@/hooks/useFormToasts";
import type { BackendError } from "@/hooks/useToast";
import {groupExpensesPath} from "@/constants/routes.ts";

type ModalType = "crear" | "unirme" | null;

const ICONS: GroupCardIcon[] = ["lilac", "green", "orange"];

function iconForGroup(group: Group): GroupCardIcon {
    return ICONS[group.id % ICONS.length];
}

export const GroupSelectionScreen = () => {
    const [modalAbierto, setModalAbierto] = useState<ModalType>(null);

    const { showSuccessToast, showApiError } = useFormToasts();

    const createGroupMutation = useCreateGroup();
    const joinGroupMutation = useJoinGroup();

    const groupsQuery = useGetGroups();
    const groups = groupsQuery.data ?? [];

    const joinRequestsQuery = useGetMyJoinRequests();
    const pendingRequests =
        joinRequestsQuery.data?.filter((r) => r.status === "PENDING") ?? [];

    const pendingApprovalsQuery = useMyPendingApprovals();
    const pendingApprovals = pendingApprovalsQuery.data;

    async function handleCreateGroup(data: GroupCreate) {
        try {
            const group = await createGroupMutation.mutateAsync(data);
            showSuccessToast(
                "Grupo creado",
                `El grupo «${group.name}» se creó correctamente.`
            );
            setModalAbierto(null);
        } catch (err) {
            showApiError(err as BackendError, "No pudimos crear el grupo");
        }
    }

    async function handleJoinGroup(data: JoinGroup) {
        try {
            const request = await joinGroupMutation.mutateAsync(data);
            showSuccessToast(
                "Solicitud enviada",
                `Tu solicitud para unirte a «${request.groupName}» está pendiente de aprobación.`
            );
            setModalAbierto(null);
        } catch (err) {
            showApiError(err as BackendError, "No pudimos enviar la solicitud");
        }
    }

    return (
        <CommonLayout className="min-h-screen login-backdrop flex flex-col">
            <div className="px-6 py-10 lg:px-30 flex-1">
                <section
                    className="flex flex-col justify-between gap-8 rounded-4xl bg-brand px-8 py-10 sm:px-11 lg:flex-row lg:items-center"
                    aria-labelledby="groups-title"
                >
                    <div>
                        <h1 id="groups-title" className="mt-1.5 text-4xl font-black text-group-paper">
                            Tus grupos
                        </h1>
                        <p className="mt-1.5 text-base text-field">
                            Gestioná el uso compartido y los gastos de cada bien.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                        <GroupAction variant="outlined" onClick={() => setModalAbierto("unirme")}>
                            Unirme a grupo
                        </GroupAction>
                        <GroupAction onClick={() => setModalAbierto("crear")}>
                            Crear grupo
                        </GroupAction>
                    </div>
                </section>

                <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
                    <section className="space-y-4 col-span-2" aria-label="Listado de grupos">
                        {groupsQuery.isLoading && (
                            <p className="p-4 text-center text-group-muted">Cargando…</p>
                        )}

                        {groupsQuery.isError && (
                            <p className="p-4 text-center text-sm font-medium text-red-600">
                                No pudimos cargar tus grupos. Probá de nuevo en un momento.
                            </p>
                        )}

                        {!groupsQuery.isLoading && !groupsQuery.isError && groups.length === 0 && (
                            <div className="rounded-xl bg-modal-surface p-8 text-center shadow">
                                <h2 className="text-xl font-bold text-group-heading">
                                    Todavía no tenés grupos
                                </h2>
                                <p className="mt-2 text-base text-group-muted">
                                    Creá un grupo nuevo o unite a uno con un código de invitación
                                    para empezar a compartir gastos.
                                </p>
                            </div>
                        )}

                        {groups.map((group) => {
                            const cardProps: GroupCardProps = {
                                name: group.name,
                                members: group.memberCount,
                                icon: iconForGroup(group),
                                code: group.joinCode
                            };
                            return (
                                <Link
                                    key={group.id}
                                    href={groupExpensesPath(group.joinCode)}
                                    className="block"
                                >
                                    <GroupCard {...cardProps} />
                                </Link>
                            );
                        })}
                    </section>

                    <aside className="flex flex-col gap-3" aria-labelledby="pending-title">
                        <section className="rounded-tl-3xl rounded-tr-lg rounded-bl-lg rounded-br-3xl bg-panel p-5 shadow-group">
                            <h2 id="pending-title" className="text-xl font-bold text-group-heading">
                                Solicitudes enviadas
                            </h2>

                            {joinRequestsQuery.isLoading && (
                                <p className="p-4 text-center text-group-muted">Cargando…</p>
                            )}

                            {!joinRequestsQuery.isLoading && pendingRequests.length === 0 && (
                                <div className="p-4 text-center w-full">
                                    <p className="text-lg font-medium text-group-muted">¡Estás al día!</p>
                                    <p className="text-base text-group-muted">
                                        No tenes ninguna solicitud de ingreso pendiente de aprobación
                                    </p>
                                </div>
                            )}

                            {pendingRequests.length > 0 && (
                                <ul className="space-y-3">
                                    {pendingRequests.map((req) => (
                                        <li
                                            key={req.memberId}
                                            className="border-b py-3 border-warm-muted"
                                        >
                                            <p className="font-semibold text-group-heading">
                                                {req.groupName}
                                            </p>
                                            <p className="text-sm text-group-muted">
                                                Esperando aprobación como{" "}
                                                <span className="font-medium">{req.nickname}</span>
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {pendingApprovals.length > 0 && (
                            <section aria-labelledby="approvals-title" className="rounded-tl-3xl rounded-tr-lg rounded-bl-lg rounded-br-3xl bg-panel p-5 shadow-group">
                                <h2
                                    id="approvals-title"
                                    className="text-xl font-bold text-group-heading"
                                >
                                    Solicitudes por aprobar
                                </h2>

                                {pendingApprovalsQuery.isLoading ? (
                                    <p className="p-4 text-center text-group-muted">Cargando…</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {pendingApprovals.map(({ groupId, groupName, member }) => (
                                            <li
                                                key={`${groupId}-${member.id}`}
                                                className="border-b py-3 border-warm-muted"
                                            >
                                                <p className="font-semibold text-group-heading">
                                                    {groupName}
                                                </p>
                                                <p className="text-sm text-group-muted">
                                                    <span className="font-medium">
                                                        {member.nickname}
                                                    </span>{" "}
                                                    quiere unirse
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )}
                    </aside>
                </div>
            </div>

            {modalAbierto === "crear" && (
                <CreateGroupModal
                    onClose={() => setModalAbierto(null)}
                    onCreate={handleCreateGroup}
                />
            )}
            {modalAbierto === "unirme" && (
                <JoinGroupModal
                    onClose={() => setModalAbierto(null)}
                    onJoin={handleJoinGroup}
                />
            )}
        </CommonLayout>
    );
};