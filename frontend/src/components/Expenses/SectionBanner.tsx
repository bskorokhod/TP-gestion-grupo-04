import type {ReactNode} from "react";

import Button from "@/components/Button.tsx";
import {cn} from "@/lib/cn.ts";
import { SECTION_BANNER_VARIANTS, type SectionBannerVariant } from "@/constants/expenses.ts";

export type { SectionBannerVariant };

export interface SectionBannerProps {
    title: string;
    description: string;
    variant: SectionBannerVariant;
    action?: ReactNode;
    onAction?: () => void;
    /** Deshabilita el botón de acción (p. ej. grupo detenido). */
    actionDisabled?: boolean;
    /** Tooltip del botón de acción; útil para explicar por qué está deshabilitado. */
    actionTitle?: string;
}

export function SectionBanner({title, description, variant, action, onAction, actionDisabled = false, actionTitle,}: SectionBannerProps) {
    return (
        <div
            className={cn(
                SECTION_BANNER_VARIANTS[variant],
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-full px-6 py-4 text-brand-foreground",
            )}
        >
            <div className="min-w-0 ps-5">
                <h2 className="text-lg font-bold sm:text-xl">
                    {title}
                </h2>

                <p className="mt-1 hidden text-base sm:block">
                    {description}
                </p>
            </div>

            {action && (
                <Button
                    type="button"
                    onClick={onAction}
                    disabled={actionDisabled}
                    title={actionTitle}
                    className="shrink-0 rounded-full p-6 text-lg"
                >
                    {action}
                </Button>
            )}
        </div>
    );
}