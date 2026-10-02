import { useState, type ReactElement } from "react";

import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import {
    EmptyState,
    PersonBalanceCard,
    type BalanceStatus,
    type PersonBalanceCardProps,
} from "@/components/Expenses/ExpensesCard.tsx";
import { NewExpenseModal } from "@/components/modals";
import { PayDebtModal } from "@/components/modals/PayDebtModal.tsx";

import { useGetBalancesByPerson } from "@/services/ExpenseServices.ts";
import type { BalanceByPerson } from "@/models/Expense.ts";
import { currency } from "@/lib/format";

interface PayTarget {
    readonly expenseId: number;
    readonly debtId: number;
    readonly amount: number;
}

export interface PerPersonViewProps {
    readonly groupId?: number;
}

export const PerPersonView = ({ groupId }: PerPersonViewProps): ReactElement => {
    const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState<boolean>(false);
    const [payTarget, setPayTarget] = useState<PayTarget | null>(null);

    const { data: balances = [], isLoading } = useGetBalancesByPerson(groupId);

    return (
        <section className=" space-y-8 px-5 py-8 sm:px-8 lg:px-30 flex-1">
            <SectionBanner
                title="Gastos por persona"
                description="Estas son las deudas que tienen con vos y las que tenés con el resto de los miembros del grupo."
                variant="allDebt"
                action="Agregar gasto"
                onAction={() => groupId != null && setIsNewExpenseModalOpen(true)}
            />

            {isLoading ? (
                <EmptyState message="Cargando balances…" />
            ) : balances.length === 0 ? (
                <EmptyState message="Todavía no hay deudas entre los miembros del grupo." />
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {balances.map((balance) => (
                        <BalanceCard
                            key={balance.member.id}
                            balance={balance}
                            onPay={(expenseId, debtId, amount) =>
                                setPayTarget({ expenseId, debtId, amount })
                            }
                        />
                    ))}
                </div>
            )}

            {isNewExpenseModalOpen && groupId != null && (
                <NewExpenseModal
                    groupId={groupId}
                    onClose={() => setIsNewExpenseModalOpen(false)}
                />
            )}

            {payTarget && groupId != null && (
                <PayDebtModal
                    groupId={groupId}
                    expenseId={payTarget.expenseId}
                    debtId={payTarget.debtId}
                    debtAmount={payTarget.amount}
                    onClose={() => setPayTarget(null)}
                    onPaid={() => setPayTarget(null)}
                />
            )}
        </section>
    );
};

interface BalanceCardProps {
    readonly balance: BalanceByPerson;
    readonly onPay: (expenseId: number, debtId: number, amount: number) => void;
}

function BalanceCard({ balance, onPay }: BalanceCardProps): ReactElement {
    const { member, items } = balance;

    const pendingDebtCount = items.filter((item) => item.type === "DEBT").length;
    const pendingCreditCount = items.filter((item) => item.type === "CREDIT").length;

    const pluralizeDebt = (count: number): string => (count === 1 ? "deuda" : "deudas");

    const balanceStatus: BalanceStatus = pendingDebtCount > 0 ? "negative" : "neutral";

    const balanceLabel =
        pendingDebtCount > 0
            ? `Tenés que pagarle ${pendingDebtCount} ${pluralizeDebt(pendingDebtCount)}`
            : pendingCreditCount > 0
                ? "No tenés que pagarle ninguna deuda"
                : "Sin deudas pendientes";

    const itemsForCard: PersonBalanceCardProps["items"] = items.map((item) => ({
        name: item.description,
        amount: currency.format(item.amount),
        variant: item.type === "CREDIT" ? "credit" : "debt",
        action: item.type === "CREDIT" ? "readonly" : "payable",
        onAction:
            item.type === "DEBT"
                ? () => onPay(item.expenseId, item.debtId, item.amount)
                : undefined,
    }));

    return (
        <PersonBalanceCard
            name={member.nickname}
            color={member.color}
            balance={balanceLabel}
            balanceStatus={balanceStatus}
            items={itemsForCard}
            photoUrl={member.photoUrl}
        />
    );
}