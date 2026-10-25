import {useQuery} from "@tanstack/react-query";

import {useApiClient} from "@/hooks/useApiClient.ts";
import {
    CategoryBreakdownSchema,
    MonthlySpendingSchema,
    PaidExpenseSchema,
    SettledExpenseSchema,
    type CategoryBreakdown,
    type MonthlySpending,
    type PaidExpense,
    type SettledExpense,
    type SpendingScope,
} from "@/models/Expense.ts";

export type {PaidExpense, SettledExpense, SpendingScope};

export interface SettledExpensesResult {
    readonly data: readonly SettledExpense[];
    readonly isLoading: boolean;
}

export interface PaidExpensesResult {
    readonly data: readonly PaidExpense[];
    readonly isLoading: boolean;
}

const NO_DATA: readonly SettledExpense[] = [];
const NO_PAID_DATA: readonly PaidExpense[] = [];

function isValidId(groupId: number | undefined): groupId is number {
    return typeof groupId === "number" && Number.isFinite(groupId) && groupId > 0;
}

/**
 * Los meses los calcula el backend, así que hay que decirle en qué zona: la del navegador, la misma con la que la
 * pantalla agrupa los gastos del historial.
 */
function balanceQuery(params: Record<string, string>): string {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new URLSearchParams({...params, zone}).toString();
}

/**
 * Gastos saldados de TODO el grupo (aprobados y sin deudas pendientes), del más nuevo al más viejo. Es un endpoint
 * propio y no `GET /groups/:id/expenses`, que solo devuelve los gastos en los que el caller está involucrado y trae
 * mucho más de lo que el historial necesita. Filtros y paginación se resuelven en la pantalla.
 *
 * La clave cuelga de `["groups", groupId, "expenses"]`: crear, editar o pagar un gasto invalida también el historial.
 */
export function useGetSettledExpenses(groupId?: number): SettledExpensesResult {
    const api = useApiClient();

    const query = useQuery({
        queryKey: ["groups", groupId, "expenses", "settled"] as const,
        enabled: isValidId(groupId),
        queryFn: async (): Promise<SettledExpense[]> => {
            const data = await api.get(`/groups/${groupId}/expenses/settled`);
            return SettledExpenseSchema.array().parse(data);
        },
    });

    return {data: query.data ?? NO_DATA, isLoading: query.isLoading};
}

/**
 * Historial personal: los gastos en los que el usuario tenía una parte y ya la pagó por completo (aunque otros sigan
 * debiendo), con lo que pagó y a quién, del más nuevo al más viejo. Sin devoluciones ni gastos eliminados. Pasar
 * `undefined` como `groupId` deja la consulta apagada.
 *
 * Cuelga de `["groups", groupId, "expenses"]` igual que el historial del grupo, así que pagar, editar o eliminar un
 * gasto también lo invalida.
 */
export function useGetPaidExpenses(groupId?: number): PaidExpensesResult {
    const api = useApiClient();

    const query = useQuery({
        queryKey: ["groups", groupId, "expenses", "paid-by-me"] as const,
        enabled: isValidId(groupId),
        queryFn: async (): Promise<PaidExpense[]> => {
            const data = await api.get(`/groups/${groupId}/expenses/paid-by-me`);
            return PaidExpenseSchema.array().parse(data);
        },
    });

    return {data: query.data ?? NO_PAID_DATA, isLoading: query.isLoading};
}

/**
 * Balance de un mes: total y monto por categoría de los gastos saldados. `month` va de 1 a 12. Con `scope` "ME" son
 * las partes del usuario en cada gasto y no el total de los gastos.
 */
export function useGetCategorySpending(
    groupId: number | undefined,
    year: number,
    month: number,
    scope: SpendingScope,
) {
    const api = useApiClient();

    return useQuery({
        queryKey: ["groups", groupId, "expenses", "balance", "categories", year, month, scope] as const,
        enabled: isValidId(groupId),
        queryFn: async (): Promise<CategoryBreakdown> => {
            const data = await api.get(
                `/groups/${groupId}/expenses/balance/categories?${balanceQuery({year: String(year), month: String(month), scope})}`,
            );
            return CategoryBreakdownSchema.parse(data);
        },
    });
}

/** Balance de un año: el total de cada uno de los 12 meses (los meses sin gastos saldados valen cero). */
export function useGetMonthlySpending(groupId: number | undefined, year: number, scope: SpendingScope) {
    const api = useApiClient();

    return useQuery({
        queryKey: ["groups", groupId, "expenses", "balance", "monthly", year, scope] as const,
        enabled: isValidId(groupId),
        queryFn: async (): Promise<MonthlySpending[]> => {
            const data = await api.get(
                `/groups/${groupId}/expenses/balance/monthly?${balanceQuery({year: String(year), scope})}`,
            );
            return MonthlySpendingSchema.array().parse(data);
        },
    });
}
