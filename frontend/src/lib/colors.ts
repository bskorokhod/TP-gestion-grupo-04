import type { MemberColor } from "@/models/Group";

/** Opacidad (%) con la que se muestra el color de un miembro en toda la app. Debe coincidir con el `/50` de `bg`. */
const MEMBER_COLOR_OPACITY = 50;

interface PaletteEntry {
    /** Clase de Tailwind (completa, para que el compilador la detecte). */
    readonly bg: string;
    /** Variable CSS del color base, para lo que necesita un color resuelto (gráficos). */
    readonly cssVar: string;
}

/**
 * Única paleta de colores de miembro. Avatares, calendario y gráficos salen de esta tabla,
 * siempre con la misma opacidad.
 */
const MEMBER_PALETTE: Readonly<Record<MemberColor, PaletteEntry>> = {
    RED: { bg: "bg-avatar-custom-red/50", cssVar: "--color-avatar-custom-red" },
    BLUE: { bg: "bg-avatar-custom-blue/50", cssVar: "--color-avatar-custom-blue" },
    GREEN: { bg: "bg-avatar-custom-green/50", cssVar: "--color-avatar-custom-green" },
    YELLOW: { bg: "bg-avatar-custom-yellow/50", cssVar: "--color-avatar-custom-yellow" },
    ORANGE: { bg: "bg-avatar-custom-orange/50", cssVar: "--color-avatar-custom-orange" },
    PURPLE: { bg: "bg-avatar-custom-purple/50", cssVar: "--color-avatar-custom-purple" },
    PINK: { bg: "bg-avatar-custom-pink/50", cssVar: "--color-avatar-custom-pink" },
    LIGHT_BLUE: { bg: "bg-avatar-custom-light-blue/50", cssVar: "--color-avatar-custom-light-blue" },
};

/** Miembro sin color asignado. */
const FALLBACK: PaletteEntry = { bg: "bg-group-muted/50", cssVar: "--color-group-muted" };

function paletteEntry(color?: MemberColor | string): PaletteEntry {
    return MEMBER_PALETTE[color as MemberColor] ?? FALLBACK;
}

/** Clase de fondo del color del miembro. Si recibe una clase `bg-*` ya resuelta, la devuelve tal cual. */
export function memberColorClass(color?: MemberColor | string): string {
    if (color?.startsWith("bg-")) return color;
    return paletteEntry(color).bg;
}

/** El mismo color que `memberColorClass`, como valor CSS para gráficos (recharts) que no usan clases. */
export function memberChartColor(color?: MemberColor | string): string {
    return `color-mix(in oklab, var(${paletteEntry(color).cssVar}) ${MEMBER_COLOR_OPACITY}%, transparent)`;
}

export function memberInitial(nickname: string): string {
    const trimmed = nickname.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "?";
}
