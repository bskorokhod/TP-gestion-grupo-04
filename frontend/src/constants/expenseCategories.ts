import {ExpenseCategorySchema, type ExpenseCategory} from "@/models/Expense.ts";
import type {MemberColor} from "@/models/Group.ts";

export {DEFAULT_EXPENSE_CATEGORY} from "@/models/Expense.ts";
export type {ExpenseCategory};

/** Los valores del enum del backend, en el orden en que se ofrecen (la categoría por defecto va última). */
export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = ExpenseCategorySchema.options;

/** Valor (el del enum del backend) -> etiqueta. El `Record` obliga a cubrir toda categoría nueva. */
export const CATEGORY_LABELS: Readonly<Record<ExpenseCategory, string>> = {
    SERVICIOS: "Servicios",
    MANTENIMIENTO: "Mantenimiento",
    COMPRAS: "Compras",
    IMPUESTOS: "Impuestos",
    LIMPIEZA: "Limpieza",
    SIN_CATEGORIA: "Sin Categoría",
};

/**
 * Color de cada categoría, tomado de la paleta única de colores de miembro (`@/lib/colors`), de modo que
 * tags, puntos de leyenda y gráficos se vean siempre igual. Sin categoría no tiene color propio: `@/lib/colors`
 * aplica su color neutro.
 */
export const CATEGORY_COLORS: Readonly<Record<ExpenseCategory, MemberColor | undefined>> = {
    SERVICIOS: "BLUE",
    MANTENIMIENTO: "ORANGE",
    COMPRAS: "YELLOW",
    IMPUESTOS: "RED",
    LIMPIEZA: "PURPLE",
    SIN_CATEGORIA: undefined,
};

export function categoryLabel(category: ExpenseCategory): string {
    return CATEGORY_LABELS[category];
}

export function categoryColor(category: ExpenseCategory): MemberColor | undefined {
    return CATEGORY_COLORS[category];
}
