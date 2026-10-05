import { useState } from "react";

import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import {DebtCard, OwedCard, PersonRow, EmptyState, MemberInfo} from "@/components/Expenses/ExpensesCard.tsx";
import { NewExpenseModal, ReportExpenseModal } from "@/components/modals";
import { PayDebtModal } from "@/components/modals/PayDebtModal.tsx";
import {
    isVisibleToCreditor,
    useGetExpensesIOwe,
    useGetExpensesOwedToMe,
    useGetGroupSummary,
} from "@/services/ExpenseServices.ts";
import type { Debt, Expense } from "@/models/Expense.ts";
import {formatCurrency} from "@/lib/format.ts";
import {useIsGroupStopped} from "@/contexts/GroupContext.tsx";
import {GROUP_STOPPED_EXPENSE_TITLE} from "@/constants/group.ts";
import {
    REFUND_OF_CANCELLED_EXPENSE_TAG,
    REFUND_TAG,
    REPORT_IN_PROGRESS_TITLE,
} from "@/constants/expenses.ts";

interface PerExpenseViewProps {
    groupId?: number;
}

interface PayTarget {
    expenseId: number;
    debtId: number;
    amount: number;
}

function toMemberInfos(expense: Expense): MemberInfo[] {
    return expense.details.participants.map((p) => ({
        nickname: p.member.nickname,
        color: p.member.color,
        photoUrl: p.member.photoUrl
    }));
}

function isOpenDebt(debt: Debt): boolean {
    return debt.status === "ACTIVE" && debt.paidAmount < debt.amount;
}

/** Etiqueta de la tarjeta cuando las deudas que se muestran son devoluciones; undefined si son partes del gasto. */
function refundTag(expense: Expense, debts: readonly Debt[]): string | undefined {
    if (!debts.some((debt) => debt.kind === "REFUND")) return undefined;
    return expense.status === "CANCELLED" ? REFUND_OF_CANCELLED_EXPENSE_TAG : REFUND_TAG;
}

/**
 * Por qué el caller no puede reportar o editar el gasto ahora, o null si puede. Espeja las reglas del backend: el gasto
 * tiene que estar aprobado y sin otra votación en curso, el grupo en marcha, y quien reporta tiene que participar del
 * gasto (acreedor o participante). Quien solo tiene una devolución a favor ve el gasto pero no lo puede reportar.
 */
function findReportBlockedReason(expense: Expense, myMemberId: number | undefined, isGroupStopped: boolean): string | null {
    if (expense.status === "CANCELLED") return "El gasto fue eliminado: ya no se puede modificar ni reportar";
    if (expense.reportInProgress) return REPORT_IN_PROGRESS_TITLE;
    if (isGroupStopped) return GROUP_STOPPED_EXPENSE_TITLE;

    const { creditor, participants } = expense.details;
    const participates = myMemberId != null
        && (creditor.id === myMemberId || participants.some((participant) => participant.member.id === myMemberId));
    return participates ? null : "Solo quienes participan del gasto pueden reportarlo";
}

export const PerExpenseView = ({ groupId }: PerExpenseViewProps) => {
    const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
    const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
    const [reportTarget, setReportTarget] = useState<Expense | null>(null);
    const isGroupStopped = useIsGroupStopped();

    const { data: summary } = useGetGroupSummary(groupId);
    const { data: owedToMe = [], isLoading: isLoadingOwed } = useGetExpensesOwedToMe(groupId);
    const { data: iOwe = [], isLoading: isLoadingIOwe } = useGetExpensesIOwe(groupId);

    const myMemberId = summary?.me.id;

    return (
        <section className=" space-y-8 px-5 py-8 sm:px-8 lg:px-30 flex-1">
            <div className="space-y-4">
                <SectionBanner
                    title="Gastos que me deben"
                    description="Estas son las deudas que otros tienen con vos. Revisá el estado del pago de cada uno y reclamá pagos cuando corresponda."
                    variant="othersDebt"
                    action="Agregar gasto"
                    onAction={() => groupId && !isGroupStopped && setIsNewExpenseModalOpen(true)}
                    actionDisabled={isGroupStopped}
                    actionTitle={isGroupStopped ? GROUP_STOPPED_EXPENSE_TITLE : undefined}
                />

                {isLoadingOwed ? (
                    <EmptyState message="Cargando gastos…" />
                ) : owedToMe.length === 0 ? (
                    <EmptyState message="Nadie te debe plata en este grupo por ahora." />
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {owedToMe.map((expense) => (
                            <ExpenseAsDebtCard
                                key={expense.id}
                                expense={expense}
                                myMemberId={myMemberId}
                                editDisabledReason={findReportBlockedReason(expense, myMemberId, isGroupStopped)}
                                onEdit={() => setReportTarget(expense)}
                            />
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
                            <ExpenseAsOwedCards
                                key={expense.id}
                                expense={expense}
                                myMemberId={myMemberId}
                                reportDisabledReason={findReportBlockedReason(expense, myMemberId, isGroupStopped)}
                                onReport={() => setReportTarget(expense)}
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

            {reportTarget && groupId != null && (
                <ReportExpenseModal
                    groupId={groupId}
                    expense={reportTarget}
                    onClose={() => setReportTarget(null)}
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

interface ExpenseAsDebtCardProps {
    readonly expense: Expense;
    readonly myMemberId?: number;
    readonly editDisabledReason: string | null;
    readonly onEdit: () => void;
}

function ExpenseAsDebtCard({ expense, myMemberId, editDisabledReason, onEdit }: ExpenseAsDebtCardProps) {
    const total = formatCurrency(expense.details.totalAmount);
    const debtsToShow = expense.debts.filter((d) => d.creditor.id === myMemberId && isVisibleToCreditor(expense, d));
    // En una devolución no hay asignados ni persona a cargo que mostrar: solo título, monto y descripción.
    const isRefund = debtsToShow.some((debt) => debt.kind === "REFUND");

    return (
        <DebtCard
            title={expense.details.title || ""}
            amount={`Total: ${total}`}
            tag={refundTag(expense, debtsToShow)}
            receiptUrl={expense.details.receiptUrl}
            description={expense.details.description || "Sin descripción"}
            assigned={isRefund ? undefined : toMemberInfos(expense)}
            owner={isRefund ? undefined : {
                nickname: expense.details.creditor.nickname,
                color: expense.details.creditor.color,
                photoUrl: expense.details.creditor.photoUrl
            }}
            onEdit={onEdit}
            editDisabledReason={editDisabledReason}
        >
            {debtsToShow.map((debt) => {
                const remaining = debt.amount - debt.paidAmount;
                const isPaid = remaining <= 0;
                const status = isPaid ? ("paid" as const) : debt.paidAmount > 0 ? ("partial" as const) : ("pending" as const);

                return (
                    <PersonRow
                        key={debt.id}
                        name={debt.debtor.nickname}
                        color={debt.debtor.color}
                        status={status}
                        action={debt.payments.length > 0 ? "claim" : "none"}
                        paidAmount={formatCurrency(debt.paidAmount)}
                        totalAmount={formatCurrency(debt.amount)}
                        photoUrl={debt.debtor.photoUrl}
                        receiptUrls={debt.payments.map((payment) => payment.receiptUrl)}
                    />
                );
            })}
        </DebtCard>
    );
}

interface ExpenseAsOwedCardsProps {
    readonly expense: Expense;
    readonly myMemberId?: number;
    readonly reportDisabledReason: string | null;
    readonly onReport: () => void;
    readonly onPay: (debtId: number, amount: number) => void;
}

/**
 * "Gastos que debo": una tarjeta por cada deuda abierta propia. Normalmente es una sola (la parte del gasto), pero
 * quien está a cargo de un gasto modificado o eliminado puede deber devoluciones a varias personas.
 */
function ExpenseAsOwedCards({ expense, myMemberId, reportDisabledReason, onReport, onPay }: ExpenseAsOwedCardsProps) {
    if (myMemberId == null) return null;

    const myDebts = expense.debts.filter((d) => d.debtor.id === myMemberId && isOpenDebt(d));

    return (
        <>
            {myDebts.map((myDebt) => {
                const remaining = myDebt.amount - myDebt.paidAmount;
                const isRefund = myDebt.kind === "REFUND";
                const total = formatCurrency(expense.details.totalAmount);

                return (
                    <OwedCard
                        key={myDebt.id}
                        title={expense.details.title || ""}
                        amount={
                            isRefund
                                ? `Total: ${total} - A devolver a ${myDebt.creditor.nickname}: ${formatCurrency(remaining)}`
                                : `Total: ${total} - Tu parte: ${formatCurrency(remaining)}`
                        }
                        tag={refundTag(expense, [myDebt])}
                        receiptUrl={expense.details.receiptUrl}
                        description={expense.details.description || "Sin descripción"}
                        assigned={isRefund ? undefined : toMemberInfos(expense)}
                        owner={isRefund ? undefined : {
                            nickname: expense.details.creditor.nickname,
                            color: expense.details.creditor.color,
                            photoUrl: expense.details.creditor.photoUrl
                        }}
                        onReport={onReport}
                        reportDisabledReason={reportDisabledReason}
                        action={{
                            label: "Marcar como pagado",
                            onClick: () => onPay(myDebt.id, remaining),
                            disabledReason: expense.reportInProgress ? REPORT_IN_PROGRESS_TITLE : null,
                        }}
                    />
                );
            })}
        </>
    );
}
