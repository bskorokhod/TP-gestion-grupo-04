import { type ReactElement, useEffect, useRef, useState } from "react";

/** Margen (px) desde el borde inferior del viewport: la sección se considera "vista" cuando su banner lo cruza. */
const VIEWPORT_MARGIN = 80;

function sectionAnchor(type: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-vote-section="${type}"]`);
}

/** True si el banner de la sección ya entró en pantalla (o quedó por encima tras scrollear). */
function isSectionSeen(type: string): boolean {
    const anchor = sectionAnchor(type);
    if (anchor == null) return false;
    return anchor.getBoundingClientRect().top < window.innerHeight - VIEWPORT_MARGIN;
}

function ChevronDown(): ReactElement {
    return (
        <svg
            viewBox="0 0 16 16"
            className="size-4 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M4 6l4 4 4-4" />
        </svg>
    );
}

export interface PendingVotesIndicatorProps {
    /** Tipos de sección que tienen al menos una votación pendiente del usuario. */
    readonly pendingSectionTypes: readonly string[];
}

/**
 * Burbuja flotante que avisa cuántas SECCIONES con votaciones pendientes quedan sin mirar y lleva a la próxima.
 * El conteo es por sección (no por voto ni por página): una sección se marca como vista cuando su banner entra en
 * pantalla y no se vuelve a contar, aunque tenga varias páginas. Se reinicia solo al remontar (salir y volver a la tab).
 */
export const PendingVotesIndicator = ({ pendingSectionTypes }: PendingVotesIndicatorProps): ReactElement | null => {
    const [pendingCount, setPendingCount] = useState(0);
    // Secciones ya vistas en este montaje; persiste entre recálculos y se reinicia al remontar.
    const seenRef = useRef<Set<string>>(new Set());

    // Clave estable del set de tipos: re-corre el efecto cuando cambian las secciones con pendientes (p. ej. al votar).
    const pendingKey = [...pendingSectionTypes].sort().join("|");

    useEffect(() => {
        const types = pendingKey ? pendingKey.split("|") : [];
        if (types.length === 0) {
            setPendingCount(0);
            return;
        }

        const recompute = (): void => {
            for (const type of types) {
                if (!seenRef.current.has(type) && isSectionSeen(type)) {
                    seenRef.current.add(type);
                }
            }
            setPendingCount(types.filter((type) => !seenRef.current.has(type)).length);
        };

        recompute();
        // Las secciones cargan async: recalculamos una vez que el layout se asentó.
        const settleTimeout = window.setTimeout(recompute, 300);
        window.addEventListener("scroll", recompute, { passive: true });
        window.addEventListener("resize", recompute);

        return () => {
            window.clearTimeout(settleTimeout);
            window.removeEventListener("scroll", recompute);
            window.removeEventListener("resize", recompute);
        };
    }, [pendingKey]);

    if (pendingCount <= 0) return null;

    const scrollToNextPending = (): void => {
        const types = pendingKey ? pendingKey.split("|") : [];
        const remaining = types
            .filter((type) => !seenRef.current.has(type))
            .map((type) => sectionAnchor(type))
            .filter((anchor): anchor is HTMLElement => anchor != null);

        // La más cercana hacia abajo (menor top entre las que están por debajo del pliegue).
        const target = remaining
            .filter((anchor) => anchor.getBoundingClientRect().top >= window.innerHeight - VIEWPORT_MARGIN)
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] ?? remaining[0];

        target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const label =
        pendingCount === 1
            ? "Ir a la sección con tu votación pendiente"
            : `Ir a las ${pendingCount} secciones con votaciones pendientes`;

    return (
        <button
            type="button"
            onClick={scrollToNextPending}
            aria-label={label}
            title={label}
            className="fixed bottom-6 right-6 z-50 flex size-11 items-center justify-center rounded-full bg-group-amber text-white shadow-panel transition-colors hover:brightness-95 animate-in fade-in slide-in-from-bottom-2"
        >
            <ChevronDown />
        </button>
    );
};
