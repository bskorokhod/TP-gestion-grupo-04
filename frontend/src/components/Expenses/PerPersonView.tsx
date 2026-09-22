import { useState } from "react";

import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import {
    EmptyState,
    PersonBalanceCard,
    type PersonBalanceCardProps,
} from "@/components/Expenses/ExpensesCard.tsx";
import { NewExpenseModal } from "@/components/modals";
import { PayDebtModal } from "@/components/modals/PayDebtModal.tsx";

import { useGetBalancesByPerson } from "@/services/ExpenseServices.ts";
import type { BalanceByPerson } from "@/models/Expense.ts";

const currency = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
});

interface PerPersonViewProps {
    groupId: number;
}

interface PayTarget {
    expenseId: number;
    debtId: number;
    amount: number;
}

export const PerPersonView = ({ groupId }: PerPersonViewProps) => {
    const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
    const [payTarget, setPayTarget] = useState<PayTarget | null>(null);

    const { data: balances = [], isLoading } = useGetBalancesByPerson(groupId);

    return (
        <section className="mx-auto space-y-8 px-5 py-8 sm:px-8 lg:px-30">
            <SectionBanner
                title="Gastos por persona"
                description="Estas son las deudas que tienen con vos y las que tenés con el resto de los miembros del grupo."
                variant="allDebt"
                action="Agregar gasto"
                onAction={() => setIsNewExpenseModalOpen(true)}
            />

            {isLoading ? (
                <EmptyState message="Cargando balances…" />
            ) : balances.length === 0 ? (
                <EmptyState message="Todavía no hay deudas entre los miembros del grupo." />
            ) : (
                <div className="grid items-start gap-4 lg:grid-cols-2">
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

            {isNewExpenseModalOpen && (
                <NewExpenseModal
                    onClose={() => setIsNewExpenseModalOpen(false)}
                    onSave={(expense) => {
                        console.log("Nuevo gasto:", expense);
                        setIsNewExpenseModalOpen(false);
                    }}
                />
            )}

            {payTarget && (
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

function BalanceCard({
                         balance,
                         onPay,
                     }: {
    balance: BalanceByPerson;
    onPay: (expenseId: number, debtId: number, amount: number) => void;
}) {
    const { member, netBalance, items } = balance;

    const balanceStatus: PersonBalanceCardProps["balanceStatus"] =
        netBalance > 0 ? "positive" : netBalance < 0 ? "negative" : "neutral";

    const balanceLabel =
        netBalance > 0
            ? `Te debe ${currency.format(netBalance)}`
            : netBalance < 0
                ? `Le debés ${currency.format(Math.abs(netBalance))}`
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
        />
    );
}