import type { ReactElement } from "react";

import { cn } from "@/lib/cn.ts";

export interface PaginationProps {
    /** Página actual; la primera es la 1. */
    readonly page: number;
    readonly totalPages: number;
    readonly onPageChange: (page: number) => void;
    readonly className?: string;
}

/** Número de página, o una clave de elipsis (string) donde se omiten páginas. */
type PageItem = number | string;

/**
 * Páginas a mostrar: siempre las dos primeras y las dos últimas, más una ventana de tres páginas alrededor de la
 * actual. Los huecos se marcan con elipsis (si falta una sola página se muestra en lugar de la elipsis).
 */
function getPageItems(page: number, totalPages: number): PageItem[] {
    const windowStart = Math.max(1, Math.min(page - 1, totalPages - 2));
    const pages = new Set<number>([1, 2, totalPages - 1, totalPages]);
    for (let current = windowStart; current < windowStart + 3; current++) pages.add(current);

    const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);

    const items: PageItem[] = [];
    sorted.forEach((value, index) => {
        const previous = sorted[index - 1];
        if (previous !== undefined) {
            if (value - previous === 2) items.push(previous + 1);
            else if (value - previous > 2) items.push(`ellipsis-${previous}`);
        }
        items.push(value);
    });

    return items;
}

function ArrowIcon({ direction }: { direction: "left" | "right" }): ReactElement {
    return (
        <svg
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            {direction === "left" ? (
                <path d="M13 8H3M7 4L3 8l4 4" />
            ) : (
                <path d="M3 8h10M9 4l4 4-4 4" />
            )}
        </svg>
    );
}

const NAV_BUTTON_CLASS =
    "flex items-center gap-2 rounded-lg px-2 py-1 text-foreground transition-colors hover:bg-muted " +
    "disabled:cursor-not-allowed disabled:text-ink-soft disabled:opacity-60 disabled:hover:bg-transparent";

/** Paginador con "Anterior"/"Siguiente", páginas numeradas y elipsis. */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps): ReactElement {
    const items = getPageItems(page, totalPages);

    return (
        <nav aria-label="Paginación" className={cn("flex flex-wrap items-center justify-center gap-3 text-sm", className)}>
            <button type="button" className={NAV_BUTTON_CLASS} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                <ArrowIcon direction="left" />
                Anterior
            </button>

            <ul className="flex items-center gap-1">
                {items.map((item) =>
                    typeof item === "string" ? (
                        <li key={item} aria-hidden className="flex size-8 items-center justify-center text-foreground">
                            …
                        </li>
                    ) : (
                        <li key={item}>
                            <button
                                type="button"
                                aria-label={`Página ${item}`}
                                aria-current={item === page ? "page" : undefined}
                                onClick={() => onPageChange(item)}
                                className={cn(
                                    "flex size-8 items-center justify-center rounded-lg transition-colors",
                                    item === page
                                        ? "bg-brand font-medium text-brand-foreground"
                                        : "text-foreground hover:bg-muted",
                                )}
                            >
                                {item}
                            </button>
                        </li>
                    ),
                )}
            </ul>

            <button
                type="button"
                className={NAV_BUTTON_CLASS}
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                Siguiente
                <ArrowIcon direction="right" />
            </button>
        </nav>
    );
}
