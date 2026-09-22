import {
  BalanceByPerson,
  BalanceByPersonSchema,
  Expense,
  ExpenseData,
  ExpenseSchema,
  ExpenseStatus,
  GroupSummary,
  GroupSummarySchema,
} from "@/models/Expense.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccessTokenGetter } from "@/contexts/TokenContext.tsx";
import { ApiService } from "@/services/ApiServices.ts";
import { useFormToasts } from "@/hooks/useFormToasts.ts";
import { uploadDebtReceipt } from "@/services/SupabaseStorageService.ts";

export function useGetExpenses(groupId?: number, status?: ExpenseStatus) {
  const getAccessToken = useAccessTokenGetter();
  const suffix = status ? `?status=${status}` : "";

  return useQuery({
    queryKey: ["groups", groupId, "expenses", status ?? "ALL"],
    // Solo ejecuta la query si tenemos un groupId numérico válido
    enabled: typeof groupId === "number" && Number.isFinite(groupId),
    queryFn: async (): Promise<Expense[]> => {
      const data = await ApiService.authenticatedRequest(
        getAccessToken,
        `/groups/${groupId}/expenses${suffix}`,
        { method: "GET" }
      );
      return ExpenseSchema.array().parse(data);
    },
  });
}

export function useCreateExpense(groupId: number) {
  const getAccessToken = useAccessTokenGetter();
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, ExpenseData>({
    mutationFn: async (payload: ExpenseData): Promise<Expense> => {
      const response = await ApiService.authenticatedRequest(
        getAccessToken,
        `/groups/${groupId}/expenses`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      return ExpenseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
    },
  });
}

export function useGetGroupSummary(groupId?: number) {
  const getAccessToken = useAccessTokenGetter();

  return useQuery({
    queryKey: ["groups", groupId, "summary"],
    enabled: typeof groupId === "number" && Number.isFinite(groupId),
    queryFn: async (): Promise<GroupSummary> => {
      const data = await ApiService.authenticatedRequest(
          getAccessToken,
          `/groups/${groupId}/expenses/summary`,
          { method: "GET" }
      );
      return GroupSummarySchema.parse(data);
    },
  });
}

export function useGetExpensesOwedToMe(groupId?: number) {
  const getAccessToken = useAccessTokenGetter();

  return useQuery({
    queryKey: ["groups", groupId, "expenses", "owed-to-me"],
    enabled: typeof groupId === "number" && Number.isFinite(groupId),
    queryFn: async (): Promise<Expense[]> => {
      const data = await ApiService.authenticatedRequest(
          getAccessToken,
          `/groups/${groupId}/expenses/owed-to-me`,
          { method: "GET" }
      );
      return ExpenseSchema.array().parse(data);
    },
  });
}

export function useGetExpensesIOwe(groupId?: number) {
  const getAccessToken = useAccessTokenGetter();

  return useQuery({
    queryKey: ["groups", groupId, "expenses", "i-owe"],
    enabled: typeof groupId === "number" && Number.isFinite(groupId),
    queryFn: async (): Promise<Expense[]> => {
      const data = await ApiService.authenticatedRequest(
          getAccessToken,
          `/groups/${groupId}/expenses/i-owe`,
          { method: "GET" }
      );
      return ExpenseSchema.array().parse(data);
    },
  });
}

export function useGetBalancesByPerson(groupId?: number) {
  const getAccessToken = useAccessTokenGetter();

  return useQuery({
    queryKey: ["groups", groupId, "balances-by-person"],
    enabled: typeof groupId === "number" && Number.isFinite(groupId),
    queryFn: async (): Promise<BalanceByPerson[]> => {
      const data = await ApiService.authenticatedRequest(
          getAccessToken,
          `/groups/${groupId}/expenses/by-person`,
          { method: "GET" }
      );
      return BalanceByPersonSchema.array().parse(data);
    },
  });
}

/**
 * Mock: sube el comprobante a Supabase y hace log del payload que iría al backend cuando exista
 * el endpoint de pagos. No pega a la API todavía.
 */
export function useMarkDebtAsPaid() {
  const { showSuccessToast, showErrorToast } = useFormToasts();

  return useMutation<
      { receiptUrl: string },
      Error,
      { groupId: number; expenseId: number; debtId: number; amount: number; receipt: File }
  >({
    mutationFn: async ({ groupId, expenseId, debtId, amount, receipt }) => {
      const receiptUrl = await uploadDebtReceipt(receipt, groupId);
      // TODO: cuando el backend exponga POST /groups/:gid/expenses/:eid/debts/:did/payments
      //       reemplazar este console.log por la llamada real.
      console.log("[MOCK] Payment payload", { groupId, expenseId, debtId, amount, receiptUrl });
      return { receiptUrl };
    },
    onSuccess: () => {
      showSuccessToast("Pago registrado", "El comprobante se subió correctamente.");
    },
    onError: (error) => {
      showErrorToast("No se pudo registrar el pago", error.message);
    },
  });
}