import { useState } from "react";

import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import { DebtCard, OwedCard, PersonRow, EmptyState } from "@/components/Expenses/ExpensesCard.tsx";
import { NewExpenseModal } from "@/components/modals";
import { PayDebtModal } from "@/components/modals/PayDebtModal.tsx";
import {
    useGetExpensesIOwe,
    useGetExpensesOwedToMe,
    useGetGroupSummary,
} from "@/services/ExpenseServices.ts";
import type { Expense } from "@/models/Expense.ts";

const currency = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
});

interface PerExpenseViewProps {
    groupId?: number;
}

interface PayTarget {
    expenseId: number;
    debtId: number;
    amount: number;
}

export const PerExpenseView = ({ groupId }: PerExpenseViewProps) => {
    const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
    const [payTarget, setPayTarget] = useState<PayTarget | null>(null);

    const { data: summary } = useGetGroupSummary(groupId);
    const { data: owedToMe = [], isLoading: isLoadingOwed } = useGetExpensesOwedToMe(groupId);
    const { data: iOwe = [], isLoading: isLoadingIOwe } = useGetExpensesIOwe(groupId);

    const myMemberId = summary?.me.id;

    return (
        <section className="mx-auto space-y-8 px-5 py-8 sm:px-8 lg:px-30">
            <div className="space-y-4">
                <SectionBanner
                    title="Gastos que me deben"
                    description="Estas son las deudas que otros tienen con vos. Revisá el estado del pago de cada uno y reclamá pagos cuando corresponda."
                    variant="othersDebt"
                    action="Agregar gasto"
                    onAction={() => groupId && setIsNewExpenseModalOpen(true)}
                />

                {isLoadingOwed ? (
                    <EmptyState message="Cargando gastos…" />
                ) : owedToMe.length === 0 ? (
                    <EmptyState message="Nadie te debe plata en este grupo por ahora." />
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {owedToMe.map((expense) => (
                            <ExpenseAsDebtCard key={expense.id} expense={expense} />
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <SectionBanner
                    title="Gastos que debo"
                    description="Estas son las deudas que tenés con otras personas."
                    variant="ownDebt"
                    action={undefined}
                />

                {isLoadingIOwe ? (
                    <EmptyState message="Cargando gastos…" />
                ) : iOwe.length === 0 ? (
                    <EmptyState message="No tenés deudas pendientes." />
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {iOwe.map((expense) => (
                            <ExpenseAsOwedCard
                                key={expense.id}
                                expense={expense}
                                myMemberId={myMemberId}
                                onPay={(debtId, amount) =>
                                    setPayTarget({ expenseId: expense.id, debtId, amount })
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

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

/** "Gastos que me deben": el caller es acreedor; mostramos cada deudor con su parte. */
function ExpenseAsDebtCard({ expense }: { expense: Expense }) {
    const total = currency.format(expense.details.totalAmount);
    const debtsToShow = expense.debts.filter(
        (d) => d.status === "ACTIVE" && d.paidAmount < d.amount,
    );

    return (
        <DebtCard
            title={expense.details.title || ""}
            amount={`Total: ${total}`}
            description={expense.details.description || "Sin descripción"}
        >
            {debtsToShow.map((debt) => {
                const remaining = debt.amount - debt.paidAmount;
                const status = debt.paidAmount > 0 ? ("partial" as const) : ("pending" as const);

                return (
                    <PersonRow
                        key={debt.id}
                        name={debt.debtor.nickname}
                        color={debt.debtor.color}
                        status={status}
                        action="claim"
                        amount={currency.format(remaining)}
                    />
                );
            })}
        </DebtCard>
    );
}

/** "Gastos que debo": filtramos la deuda propia usando el id que nos dio el summary. */
function ExpenseAsOwedCard({
                               expense,
                               myMemberId,
                               onPay,
                           }: {
    expense: Expense;
    myMemberId?: number;
    onPay: (debtId: number, amount: number) => void;
}) {
    if (myMemberId == null) return null;

    const myDebt = expense.debts.find(
        (d) => d.debtor.id === myMemberId && d.status === "ACTIVE" && d.paidAmount < d.amount,
    );
    if (!myDebt) return null;

    const remaining = myDebt.amount - myDebt.paidAmount;

    return (
        <OwedCard
            title={expense.details.title || ""}
            amount={`Total: ${currency.format(expense.details.totalAmount)} - Tu parte: ${currency.format(remaining)}`}
            description={expense.details.description || "Sin descripción"}
            assigned={[{ nickname: myDebt.debtor.nickname, color: myDebt.debtor.color }]}
            owner={{
                nickname: expense.details.creditor.nickname,
                color: expense.details.creditor.color,
            }}
            action={{
                label: "Marcar como pagado",
                onClick: () => onPay(myDebt.id, remaining),
            }}
        />
    );
}