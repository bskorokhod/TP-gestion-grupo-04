import {MemberInfoCard} from "@/components/AdminCard";
import {Member, MEMBERS} from "@/models/User";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import Button from "@/components/Button.tsx";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {can} from "@/lib/permissions.ts";
import {Link, useLocation} from "wouter";


export interface Page {
    readonly id: string;
    readonly label: string;
}


export interface ConfigPageProps {
    readonly members: ReadonlyArray<Member>;
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

export const ConfigurationScreen = () => {
    const [location] = useLocation();
    const group = useCurrentGroup();

    // Todos los miembros ven la configuración; solo admin/fundador ACTIVE pueden modificarla.
    const canReviewJoinRequests = can(group, "reviewJoinRequests");
    const canConfigure = can(group, "editPercentages");

    return (
        <CommonLayout>
            <GroupNavbar>
                {canReviewJoinRequests && (
                    <Button size="xl2" variant="modalSecondary">Agregar miembro</Button>
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
                                    href={location + "/porcentajes"}
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
                    </>
                ) : (
                    <p className="pt-2 text-base text-warm-muted">
                        Solo el fundador y los administradores del grupo pueden modificar esta configuración.
                    </p>
                )}
            </div>
        </CommonLayout>
    );
};
