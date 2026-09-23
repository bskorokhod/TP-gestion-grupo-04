import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BalanceByPerson, Expense, ExpenseData, ExpenseMember, ExpenseSchema, ExpenseStatus, GroupSummary } from "@/models/Expense";
import { useApiClient } from "@/hooks/useApiClient";
import { useFormToasts } from "@/hooks/useFormToasts.ts";
import { uploadDebtReceipt } from "@/lib/supabase";
import { useMyMember } from "@/services/GroupServices";


// ─────────────────────────────────────────────────────────────────────────────
// Reads contra el backend real
// ─────────────────────────────────────────────────────────────────────────────

export function useGetExpenses(groupId?: number, status?: ExpenseStatus) {
    const api = useApiClient();
    const suffix = status ? `?status=${status}` : "";

    return useQuery({
        queryKey: ["groups", groupId, "expenses", status ?? "ALL"] as const,
        enabled: typeof groupId === "number" && Number.isFinite(groupId) && groupId > 0,
        queryFn: async (): Promise<Expense[]> => {
            if (typeof groupId !== "number") return [];
            const data = await api.get(`/groups/${groupId}/expenses${suffix}`);
            return ExpenseSchema.array().parse(data);
        },
    });
}

export function useCreateExpense(groupId: number) {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation<Expense, Error, ExpenseData>({
      mutationFn: async (payload): Promise<Expense> => {
          const response = await api.post(`/groups/${groupId}/expenses`, payload);
          return ExpenseSchema.parse(response);
      },
      onSuccess: (): void => {
          void qc.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
      },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function toExpenseMember(m: {
  id: number;
  nickname: string;
  color: ExpenseMember["color"];
}): ExpenseMember {
  return { id: m.id, nickname: m.nickname, color: m.color };
}


function expenseLabel(details: Expense["details"]): string {
  const title = details.title?.trim();
  return title && title.length > 0 ? title : details.description;
}

// ─────────────────────────────────────────────────────────────────────────────
// Derivados client-side
// ─────────────────────────────────────────────────────────────────────────────

export interface GroupSummaryResult {
  readonly data: GroupSummary | undefined;
  readonly isLoading: boolean;
}

export function useGetGroupSummary(groupId?: number): GroupSummaryResult {
  const { data: expenses, isLoading } = useGetExpenses(groupId);
  const me = useMyMember(groupId);

  const data = useMemo<GroupSummary | undefined>(() => {
    if (!me || !expenses) return undefined;

    let owes = 0;
    let owed = 0;
    let pendingExpenses = 0;

    for (const e of expenses) {
      if (e.status === "PENDING_APPROVAL") pendingExpenses++;
      if (e.status !== "APPROVED") continue;

      for (const d of e.debts) {
        if (d.status !== "ACTIVE") continue;
        const remaining = d.amount - d.paidAmount;
        if (remaining <= 0) continue;

        if (d.debtor.id === me.id) owes += remaining;
        if (d.creditor.id === me.id) owed += remaining;
      }
    }

    return { me: toExpenseMember(me), owes, owed, pendingExpenses };
  }, [me, expenses]);

  return { data, isLoading };
}

export interface DerivedExpensesResult {
  readonly data: Expense[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => Promise<unknown>;
}


export function useGetExpensesOwedToMe(groupId?: number): DerivedExpensesResult {
  const query = useGetExpenses(groupId, "APPROVED");
  const me = useMyMember(groupId);

  const data = useMemo<Expense[]>(() => {
    if (!me || !query.data) return [];
    return query.data.filter((e) =>
        e.debts.some(
            (d) =>
                d.creditor.id === me.id &&
                d.status === "ACTIVE" &&
                d.paidAmount < d.amount,
        ),
    );
  }, [query.data, me]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  };
}

/** Reemplazable por GET /groups/:id/expenses/i-owe cuando exista. */
export function useGetExpensesIOwe(groupId?: number): DerivedExpensesResult {
  const query = useGetExpenses(groupId, "APPROVED");
  const me = useMyMember(groupId);

  const data = useMemo<Expense[]>(() => {
    if (!me || !query.data) return [];
    return query.data.filter((e) =>
        e.debts.some(
            (d) =>
                d.debtor.id === me.id &&
                d.status === "ACTIVE" &&
                d.paidAmount < d.amount,
        ),
    );
  }, [query.data, me]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  };
}

export interface DerivedBalancesResult {
  readonly data: BalanceByPerson[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => Promise<unknown>;
}

/** Reemplazable por GET /groups/:id/expenses/by-person cuando exista. */
export function useGetBalancesByPerson(groupId?: number): DerivedBalancesResult {
  const query = useGetExpenses(groupId, "APPROVED");
  const me = useMyMember(groupId);

  const data = useMemo<BalanceByPerson[]>(() => {
    if (!me || !query.data) return [];

    const byMember = new Map<number, BalanceByPerson>();

    const ensure = (member: ExpenseMember): BalanceByPerson => {
      const existing = byMember.get(member.id);
      if (existing) return existing;

      const created: BalanceByPerson = { member, netBalance: 0, items: [] };
      byMember.set(member.id, created);
      return created;
    };

    for (const e of query.data) {
      for (const d of e.debts) {
        if (d.status !== "ACTIVE" || d.paidAmount >= d.amount) continue;

        const remaining = d.amount - d.paidAmount;
        const iAmCreditor = d.creditor.id === me.id;
        const iAmDebtor = d.debtor.id === me.id;
        if (!iAmCreditor && !iAmDebtor) continue;

        const counterpart = iAmCreditor ? d.debtor : d.creditor;
        const bucket = ensure(counterpart);

        bucket.items.push({
          expenseId: e.id,
          debtId: d.id,
          description: expenseLabel(e.details), // ← fix: antes era e.details.title
          amount: remaining,
          type: iAmCreditor ? "CREDIT" : "DEBT",
        });
        bucket.netBalance += iAmCreditor ? remaining : -remaining;
      }
    }

    return [...byMember.values()].filter((b) => b.items.length > 0);
  }, [query.data, me]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock de pago
// ─────────────────────────────────────────────────────────────────────────────

export interface MarkDebtAsPaidInput {
  readonly groupId: number;
  readonly expenseId: number;
  readonly debtId: number;
  readonly amount: number;
  readonly receipt: File;
}

export interface MarkDebtAsPaidResult {
  readonly receiptUrl: string;
}

export function useMarkDebtAsPaid() {
  const { showSuccessToast, showErrorToast } = useFormToasts();

  return useMutation<MarkDebtAsPaidResult, Error, MarkDebtAsPaidInput>({
    mutationFn: async ({ groupId, expenseId, debtId, amount, receipt }) => {
      const receiptUrl = await uploadDebtReceipt(receipt, groupId);

      // TODO: cuando el backend exponga POST /groups/:gid/expenses/:eid/debts/:did/payments
      //       reemplazar este console.log por la llamada real.
      console.log("[MOCK] Payment payload", {
        groupId,
        expenseId,
        debtId,
        amount,
        receiptUrl,
      });
      return { receiptUrl };
    },
    onSuccess: (): void => {
      showSuccessToast("Pago registrado", "El comprobante se subió correctamente.");
    },
    onError: (error): void => {
      showErrorToast("No se pudo registrar el pago", error.message);
    },
  });
}