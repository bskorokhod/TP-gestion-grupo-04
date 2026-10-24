import type { ComponentProps, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type IconProp = ComponentProps<typeof FontAwesomeIcon>["icon"];

export interface CardActionButtonProps {
    readonly icon: IconProp;
    readonly label: string;
    readonly onClick?: () => void;
    /** Si está, el botón queda deshabilitado y este texto reemplaza al tooltip para explicar por qué. */
    readonly disabledReason?: string | null;
    /** "danger" pinta el ícono de rojo (p. ej. reclamar un pago). */
    readonly tone?: "brand" | "danger";
}

/** Botón de ícono para la esquina superior derecha de la tarjeta, con tooltip en hover y foco. */
export function CardActionButton({ icon, label, onClick, disabledReason, tone = "brand" }: CardActionButtonProps): ReactNode {
    const isDisabled = disabledReason != null;
    const tooltip = disabledReason ?? label;

    return (
        <span className="group relative inline-flex">
            <button
                type="button"
                onClick={onClick}
                disabled={isDisabled}
                aria-label={tooltip}
                className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-full ${tone === "danger" ? "text-group-danger" : "text-brand"} transition-colors hover:bg-group-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
            >
                <FontAwesomeIcon icon={icon} className="h-4 w-4" aria-hidden />
            </button>
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute right-0 top-full z-10 mt-1 rounded-md ${tone === "danger" ? "bg-group-danger" : "bg-brand"} px-2 py-1 text-xs font-medium text-brand-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${isDisabled ? "w-56 whitespace-normal" : "whitespace-nowrap"}`}
            >
                {tooltip}
            </span>
        </span>
    );
}