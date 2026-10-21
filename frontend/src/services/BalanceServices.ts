import {useQuery} from "@tanstack/react-query";

import {useApiClient} from "@/hooks/useApiClient.ts";
import {SettledExpenseSchema, type SettledExpense} from "@/models/Expense.ts";

export type {SettledExpense};

export interface SettledExpensesResult {
    readonly data: readonly SettledExpense[];
    readonly isLoading: boolean;
}

const NO_DATA: readonly SettledExpense[] = [];

/**
 * Gastos saldados de TODO el grupo (aprobados y sin deudas pendientes), del más nuevo al más viejo. Es un endpoint
 * propio y no `GET /groups/:id/expenses`, que solo devuelve los gastos en los que el caller está involucrado y trae
 * mucho más de lo que el historial necesita. Filtros, paginación y totales se calculan en la pantalla.
 *
 * La clave cuelga de `["groups", groupId, "expenses"]`: crear, editar o pagar un gasto invalida también el historial.
 */
export function useGetSettledExpenses(groupId?: number): SettledExpensesResult {
    const api = useApiClient();

    const query = useQuery({
        queryKey: ["groups", groupId, "expenses", "settled"] as const,
        enabled: typeof groupId === "number" && Number.isFinite(groupId) && groupId > 0,
        queryFn: async (): Promise<SettledExpense[]> => {
            const data = await api.get(`/groups/${groupId}/expenses/settled`);
            return SettledExpenseSchema.array().parse(data);
        },
    });

    return {data: query.data ?? NO_DATA, isLoading: query.isLoading};
}
