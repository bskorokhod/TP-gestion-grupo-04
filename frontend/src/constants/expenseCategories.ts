import type {MemberColor} from "@/models/Group.ts";

/**
 * TODO(categorías): el backend todavía no guarda una categoría por gasto (ni en ExpenseDetails ni en sus DTOs).
 * Hasta que exista, `SettledExpense.category` viene siempre null y todo se muestra como "Sin categoría".
 * Cuando se implemente en el backend, alinear estos valores con su enum.
 */
export const EXPENSE_CATEGORIES = [
    "Servicios",
    "Mantenimiento",
    "Jardín",
    "Compras",
    "Impuestos",
    "Limpieza",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const UNCATEGORIZED_LABEL = "Sin categoría";

/**
 * Color de cada categoría, tomado de la paleta única de colores de miembro (`@/lib/colors`), de modo que
 * tags, puntos de leyenda y gráficos se vean siempre igual.
 */
export const CATEGORY_COLORS: Readonly<Record<ExpenseCategory, MemberColor>> = {
    Servicios: "BLUE",
    Mantenimiento: "ORANGE",
    Jardín: "GREEN",
    Compras: "YELLOW",
    Impuestos: "RED",
    Limpieza: "PURPLE",
};

export function categoryLabel(category: ExpenseCategory | null): string {
    return category ?? UNCATEGORIZED_LABEL;
}

/** Sin categoría devuelve undefined: `@/lib/colors` aplica su color neutro. */
export function categoryColor(category: ExpenseCategory | null): MemberColor | undefined {
    return category === null ? undefined : CATEGORY_COLORS[category];
}
