import type {ExpenseCategory} from "@/constants/expenseCategories.ts";
import type {ExpenseMember} from "@/models/Expense.ts";

/** Gasto saldado (todos sus deudores ya pagaron) tal como lo consume la pantalla de balance. */
export interface SettledExpense {
    readonly id: number;
    /** ISO-8601. Única fecha disponible hoy; la definición final queda pendiente del endpoint nuevo. */
    readonly createdAt: string;
    readonly title: string;
    /** null mientras el backend no tenga categorías (ver `@/constants/expenseCategories`). */
    readonly category: ExpenseCategory | null;
    /** Quien pagó el gasto ("A cargo de"). */
    readonly creditor: ExpenseMember;
    readonly totalAmount: number;
}

export interface SettledExpensesResult {
    readonly data: readonly SettledExpense[];
    readonly isLoading: boolean;
}

const NO_DATA: readonly SettledExpense[] = [];

/**
 * TODO(backend): falta un endpoint con los gastos saldados de TODO el grupo.
 *  `GET /groups/{id}/expenses` solo devuelve los gastos en los que el caller está involucrado (`Expense.isInvolved`),
 *  así que no sirve para un balance del grupo, y el backend no tiene un estado "saldado" ni una fecha de saldado.
 *  A definir junto con el endpoint: qué cuenta como saldado (APPROVED con todas las deudas pagadas, incluidos los
 *  gastos sin participantes), qué fecha usar para los filtros y la forma exacta de la respuesta.
 *  Cuando exista: reemplazar este stub por un `useQuery` con su schema de zod que devuelva `SettledExpense[]`.
 *  Mientras tanto no se usa `useGetExpenses` a propósito: la pantalla queda sin datos.
 */
export function useGetSettledExpenses(groupId?: number): SettledExpensesResult {
    void groupId;
    return {data: NO_DATA, isLoading: false};
}
