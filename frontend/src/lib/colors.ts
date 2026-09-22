import type { MemberColor } from "@/models/Group";

/** Color suave (50% opacidad) — para fondos con texto oscuro encima. */
const MEMBER_COLOR_SOFT: Readonly<Record<MemberColor, string>> = {
    RED: "bg-custom-red/50",
    BLUE: "bg-custom-blue/50",
    GREEN: "bg-custom-green/50",
    YELLOW: "bg-custom-yellow/50",
    ORANGE: "bg-custom-orange/50",
    PURPLE: "bg-custom-purple/50",
    PINK: "bg-custom-pink/50",
    LIGHT_BLUE: "bg-custom-light-blue/50",
};

/** Color pleno — para avatares, badges y elementos destacados. */
const MEMBER_COLOR_SOLID: Readonly<Record<MemberColor, string>> = {
    RED: "bg-custom-red",
    BLUE: "bg-custom-blue",
    GREEN: "bg-custom-green",
    YELLOW: "bg-custom-yellow",
    ORANGE: "bg-custom-orange",
    PURPLE: "bg-custom-purple",
    PINK: "bg-custom-pink",
    LIGHT_BLUE: "bg-custom-light-blue",
};

const FALLBACK_SOFT = "bg-group-muted/50";
const FALLBACK_SOLID = "bg-group-muted";

function resolveColorClass(
    color: MemberColor | string | undefined,
    table: Readonly<Record<MemberColor, string>>,
    fallback: string,
): string {
    if (!color) return fallback;
    if (color.startsWith("bg-")) return color;
    return table[color as MemberColor] ?? fallback;
}

export function memberColorClass(color?: MemberColor | string): string {
    return resolveColorClass(color, MEMBER_COLOR_SOFT, FALLBACK_SOFT);
}

export function memberColorSolidClass(color?: MemberColor | string): string {
    return resolveColorClass(color, MEMBER_COLOR_SOLID, FALLBACK_SOLID);
}

export function memberInitial(nickname: string): string {
    const trimmed = nickname.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "?";
}