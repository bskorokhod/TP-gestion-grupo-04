import GroupAction from "@/components/GroupAction.tsx";
import GroupCard from "@/components/GroupCard.tsx";
import GroupsNavbar from "@/components/GroupsNavbar.tsx";
import PendingDecisions from "@/components/PendingDecisions.tsx";

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
    },
    {
        name: "Cuenta de Steam",
        members: 6,
        icon: "green",
        badges: [{label: "$8.200", kind: "expense"}],
        turn: "Sin turnos próximos",
    },
    {
        name: "PS5",
        members: 3,
        icon: "amber",
        badges: [{label: "$3.500", kind: "credit"}],
        turn: "Tu turno: hoy",
    },
];

export const GroupsScreen = () => {
    return (
        <main className="min-h-screen login-backdrop">
            <GroupsNavbar/>
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                <section
                    className="flex flex-col justify-between gap-8 rounded-4xl bg-brand px-8 py-10 sm:px-11 lg:flex-row lg:items-center"
                    aria-labelledby="groups-title">
                    <div>
                        <p className="text-base font-light text-field">Bienvenida otra vez!</p>
                        <h1 id="groups-title" className="mt-1.5 text-4xl font-black text-group-paper">
                            Tus grupos
                        </h1>
                        <p className="mt-1.5 text-base text-field">Gestioná el uso compartido y los gastos de cada
                            bien.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <GroupAction variant="outlined" href="#unirme">
                            Unirme a grupo
                        </GroupAction>
                        <GroupAction href="#crear">Crear grupo</GroupAction>
                    </div>
                </section>

                <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
                    <section className="space-y-4" aria-label="Listado de grupos">
                        {groups.map((group) => (
                            <GroupCard key={group.name} {...group} />
                        ))}
                    </section>
                    <PendingDecisions/>
                </div>
            </div>
        </main>
    );
}