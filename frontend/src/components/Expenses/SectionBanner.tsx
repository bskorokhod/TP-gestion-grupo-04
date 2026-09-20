import type {ReactNode} from "react";

import Button from "@/components/Button.tsx";
import {cn} from "@/lib/cn.ts";

const variants = {
    othersDebt: "bg-group-green",
    ownDebt: "bg-group-danger",
    allDebt: "bg-brand-hover"
}

export type SectionBannerVariant = keyof typeof variants

export interface SectionBannerProps {
    title: string;
    description: string;
    variant: SectionBannerVariant;
    action?: ReactNode;
}

export function SectionBanner({ title, description, variant, action }: SectionBannerProps) {
    return (
        <div className={cn(variants[variant], 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-full px-6 py-4 text-brand-foreground')}>
            <div className="min-w-0 ps-5">
                <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
                <p className="mt-1 hidden text-base sm:block">{description}</p>
            </div>
            {action && <Button className="shrink-0 rounded-full p-6 text-lg">{action}</Button>}
        </div>
    );
}
