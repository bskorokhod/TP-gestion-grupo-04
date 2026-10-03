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

/** Mismos colores que el avatar de cada miembro. Usado por gráficos (recharts) que necesitan un color resuelto. */
export const MEMBER_COLOR_HEX: Readonly<Record<MemberColor, string>> = {
    RED: "var(--color-avatar-custom-red)",
    BLUE: "var(--color-avatar-custom-blue)",
    GREEN: "var(--color-avatar-custom-green)",
    YELLOW: "var(--color-avatar-custom-yellow)",
    ORANGE: "var(--color-avatar-custom-orange)",
    PURPLE: "var(--color-avatar-custom-purple)",
    PINK: "var(--color-avatar-custom-pink)",
    LIGHT_BLUE: "var(--color-avatar-custom-light-blue)",
};

/** Paleta de respaldo cuando un miembro no tiene color asignado. */
export const CHART_FALLBACK_COLORS: ReadonlyArray<string> = [
    "var(--custom-red)",
    "var(--custom-orange)",
    "var(--custom-green)",
    "var(--custom-lilac)",
    "var(--custom-me)",
    "var(--group-amber)",
];

export function resolveChartColor(color: MemberColor | undefined, index: number): string {
    if (color && MEMBER_COLOR_HEX[color]) {
        return MEMBER_COLOR_HEX[color];
    }
    return CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length];
}