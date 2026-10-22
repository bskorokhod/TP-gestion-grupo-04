import type {ReactElement} from "react";

interface ViewToggleProps {
    /** Etiqueta de la vista que se ve con el switch a la izquierda. */
    readonly leftLabel: string;
    /** Etiqueta de la vista que se ve con el switch a la derecha. */
    readonly rightLabel: string;
    /** True si está activa la vista de la derecha. */
    readonly rightActive: boolean;
    readonly onToggle: () => void;
}

/** Pestaña colgada del navbar del grupo para alternar entre dos vistas de una misma pantalla. */
export function ViewToggle({leftLabel, rightLabel, rightActive, onToggle}: ViewToggleProps): ReactElement {
    return (
        <div className="flex justify-end">
            <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-3 rounded-b-3xl bg-brand px-6 py-3 text-base text-brand-foreground"
                aria-pressed={rightActive}
            >
                {leftLabel}
                <span
                    className={`flex h-6 w-12 items-center rounded-full bg-panel p-1 ${rightActive ? "justify-end" : "justify-start"}`}
                >
                    <span className="size-4 rounded-full bg-group-green"/>
                </span>
                {rightLabel}
            </button>
        </div>
    );
}
