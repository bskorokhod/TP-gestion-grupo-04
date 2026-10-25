import type { ComponentProps, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "@/components/Button.tsx";

export type IconProp = ComponentProps<typeof FontAwesomeIcon>["icon"];

export type TooltipPlacement = "bottom" | "top";

interface CardActionButtonProps {
    readonly icon: IconProp;
    readonly label: string;
    readonly onClick?: () => void;
    readonly disabledReason?: string | null;
    readonly tone?: "brand" | "danger";
    /** Dónde se abre el tooltip; "top" evita que lo recorte un contenedor con scroll (p. ej. la tabla del historial). */
    readonly tooltipPlacement?: TooltipPlacement;
}

/** Botón de ícono para la esquina superior derecha de la tarjeta, con tooltip en hover y foco. */
export function CardActionButton({ icon, label, onClick, disabledReason, tone = "brand", tooltipPlacement = "bottom" }: CardActionButtonProps): ReactNode {
    const isDisabled = disabledReason != null;
    const tooltip = disabledReason ?? label;

    return (
        <span className="group relative inline-flex">
            <Button
                type="button"
                variant={tone === "danger" ? "cardActionDanger" : "cardAction"}
                size="cardAction"
                className="size-8"
                onClick={onClick}
                disabled={isDisabled}
                aria-label={tooltip}
            >
                <FontAwesomeIcon icon={icon} className="h-4 w-4" aria-hidden />
            </Button>
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute right-0 z-10 rounded-md ${tooltipPlacement === "top" ? "bottom-full mb-1" : "top-full mt-1"} ${tone === "danger" ? "bg-group-danger" : "bg-brand"} px-2 py-1 text-xs font-medium text-brand-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 ${isDisabled ? "w-56 whitespace-normal" : "whitespace-nowrap"}`}
            >
                {tooltip}
            </span>
        </span>
    );
}

