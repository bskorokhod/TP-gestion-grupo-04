import GroupAction from "@/components/GroupAction.tsx";
import GroupCard from "@/components/GroupCard.tsx";
import {Link} from "wouter";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {useState} from "react";
import {createGroup} from "@/lib/api/groups.ts";
import {CreateGroupModal, JoinGroupModal} from "@/components/modals";

const groups = [
    {
        name: "Casa Madryn",
        members: 5,
        icon: "lilac",
        badges: [
            {label: "$11.500", kind: "expense"},
            {label: "$25.000", kind: "credit"},
        ],
        turn: "Próximo turno: 12 – 14 sep",
        link: "123-ABC-123"
    },
    {
        name: "Cuenta de Steam",
        members: 6,
        icon: "green",
        badges: [{label: "$8.200", kind: "expense"}],
        turn: "Sin turnos próximos",
        link: "#"
    },
    {
        name: "PS5",
        members: 3,
        icon: "orange",
        badges: [{label: "$3.500", kind: "credit"}],
        turn: "Tu turno: hoy",
        link: "#"
    },
];

type ModalType = "crear" | "unirme" | null;

export const GroupSelectionScreen = () => {
    const [modalAbierto, setModalAbierto] = useState<ModalType>(null);
    const [, setError] = useState<string | null>(null);

    async function handleCreateGroup(name: string) {
        try {
            setError(null);
            await createGroup(name);
            setModalAbierto(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear el grupo");
        }
    }

    return (
        <CommonLayout className="min-h-screen login-backdrop flex flex-col">
            <div className="px-6 py-10 lg:px-30 flex-1">
                <section
                    className="flex flex-col justify-between gap-8 rounded-4xl bg-brand px-8 py-10 sm:px-11 lg:flex-row lg:items-center"
                    aria-labelledby="groups-title">
                    <div>
                        <h1 id="groups-title" className="mt-1.5 text-4xl font-black text-group-paper">
                            Tus grupos
                        </h1>
                        <p className="mt-1.5 text-base text-field">Gestioná el uso compartido y los gastos de cada
                            bien.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                        <p className="text-xl text-group-paper text-right">
                            Mi código de usuario <br/>
                            <span className="font-bold text-4xl">AAA111</span></p>
                        <GroupAction onClick={() => setModalAbierto("crear")}>Crear grupo</GroupAction>
                    </div>
                </section>

                <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
                    <section className="space-y-4 col-span-2" aria-label="Listado de grupos">
                        {groups.map((group) => (
                            <Link key={"grupo-" + group.link} href={"/grupos/" + group.link + "/gastos"} className="block">
                                <GroupCard key={group.name} {...group} />
                            </Link>
                        ))}
                    </section>

                    <aside className="rounded-tl-3xl rounded-tr-lg rounded-bl-lg rounded-br-3xl bg-panel p-5 shadow-group"
                           aria-labelledby="pending-title">
                        <h2 id="pending-title" className="text-xl font-bold text-group-heading">
                            Solicitudes pendientes
                        </h2>

                        {/* TODO Lista de Cards cuando se defina bien como van a ser*/}
                        <div className="p-4 text-center w-full">
                            <p className="text-lg font-medium text-group-muted">¡Estás al día!</p>
                            <p className="text-base text-group-muted">No tenes invitaciones a grupos pendientes</p>
                        </div>
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
}