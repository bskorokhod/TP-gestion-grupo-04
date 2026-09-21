import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccessTokenGetter } from "@/contexts/TokenContext.tsx";
import { ApiService } from "@/services/ApiServices.ts";
import { Expense, ExpenseData, ExpenseSchema, ExpenseStatus } from "@/models/Expense.ts";

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