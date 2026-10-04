import { Link } from "wouter";

import { groupPercentagesPath } from "@/constants/routes.ts";
import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { cn } from "@/lib/cn.ts";

interface GroupStoppedBannerProps {
    readonly className?: string;
}

/**
 * Aviso de grupo detenido. No renderiza nada si el grupo está funcionando.
 * Va dentro de un GroupGuard (usa el grupo actual).
 */
export function GroupStoppedBanner({ className }: GroupStoppedBannerProps) {
    const group = useCurrentGroup();

    if (group.status !== "STOPPED") {
        return null;
    }

    const isPercentageGroup = group.settings.distributionMode === "PERCENTAGE";
    const canFix = isPercentageGroup && group.myStatus === "ACTIVE";

    return (
        <div
            role="alert"
            className={cn(
                "rounded-xl border border-group-danger/20 bg-group-danger-soft px-4 py-3 text-sm text-group-danger mb-4",
                className,
            )}
        >
            <p className="font-semibold">El grupo está detenido.</p>
            <p>
                {isPercentageGroup
                    ? `Los porcentajes de los miembros suman ${group.assignedPercentage}% y faltan ${group.missingPercentage}% para llegar al 100%. `
                    : "El grupo no tiene miembros activos. "}
                Mientras tanto no se pueden crear gastos, votar ni reservar días.
                {canFix && (
                    <>
                        {" "}
                        <Link href={groupPercentagesPath(group.joinCode)} className="font-semibold underline">
                            Ajustar mi porcentaje
                        </Link>
                    </>
                )}
            </p>
        </div>
    );
}
