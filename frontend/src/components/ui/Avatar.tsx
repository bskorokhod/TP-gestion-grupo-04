import type { ReactElement } from "react";

import { cn } from "@/lib/cn";
import {memberColorClass, memberInitial} from "@/lib/colors";
import type { MemberColor } from "@/models/Group";

const SIZE_CLASSES = {
    sm: "size-7 text-sm",
    md: "size-9 text-base",
    lg: "size-11 text-lg",
} as const;

export type AvatarSize = keyof typeof SIZE_CLASSES;

export interface AvatarProps {
    readonly name: string;
    readonly color?: MemberColor;
    readonly photoUrl?: string | null;
    readonly size?: AvatarSize;
    readonly className?: string;
}

/**
 * Avatar unificado: foto si hay, inicial + color de miembro si no.
 * Reemplaza los avatares duplicados que había en ExpensesCard, AdminCard, PersonChip y MemberPicker.
 */
export function Avatar({name, color, photoUrl, size = "sm", className,}: AvatarProps): ReactElement {
    const sizeClasses = SIZE_CLASSES[size];

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={name}
                className={cn("shrink-0 rounded-full object-cover", sizeClasses, className)}
            />
        );
    }

    return (
        <span
            aria-hidden
            className={cn(
                "grid shrink-0 place-items-center rounded-full font-semibold text-brand-foreground",
                sizeClasses,
                memberColorClass(color),
                className,
            )}
        >
            {memberInitial(name)}
        </span>
    );
}