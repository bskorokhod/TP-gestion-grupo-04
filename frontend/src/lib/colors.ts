import type { MemberColor } from "@/models/Group";

const MEMBER_COLOR_SOFT: Readonly<Record<MemberColor, string>> = {
    RED: "bg-avatar-custom-red/50",
    BLUE: "bg-avatar-custom-blue/50",
    GREEN: "bg-avatar-custom-green/50",
    YELLOW: "bg-avatar-custom-yellow/50",
    ORANGE: "bg-avatar-custom-orange/50",
    PURPLE: "bg-avatar-custom-purple/50",
    PINK: "bg-avatar-custom-pink/50",
    LIGHT_BLUE: "bg-avatar-custom-light-blue/50",
};

const FALLBACK_SOFT = "bg-group-muted/50";

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

export function memberInitial(nickname: string): string {
    const trimmed = nickname.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "?";
}