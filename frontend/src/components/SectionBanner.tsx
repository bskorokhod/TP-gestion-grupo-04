import type {ReactNode} from "react";

import Button from "@/components/Button.tsx";

export interface SectionBannerProps {
    title: string;
    description: string;
    tone: "success" | "danger";
    action?: ReactNode;
}

export function SectionBanner({ title, description, tone, action }: SectionBannerProps) {
    return (
        <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-full px-6 py-4 text-brand-foreground ${tone === "success" ? "bg-group-green" : "bg-group-danger"}`}>
            <div className="min-w-0">
                <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
                <p className="mt-1 hidden text-xs sm:block">{description}</p>
            </div>
            {action && <Button className="shrink-0 rounded-full p-6 text-lg">{action}</Button>}
        </div>
    );
}
