import { useState, type ReactElement } from "react";

import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { useFormToasts } from "@/hooks/useFormToasts.ts";
import type { BackendError } from "@/hooks/useToast.ts";
import { formatCurrency } from "@/lib/format.ts";
import { uploadExpenseReceipt } from "@/lib/supabase.ts";
import { describeResolvedVote, reachesExtraordinaryThreshold } from "@/lib/votes.ts";
import type { Expense, ExpenseData, SplitMethod } from "@/models/Expense.ts";
import type { Vote } from "@/models/Vote.ts";
import { useDeleteExpense, useUpdateExpense } from "@/services/ExpenseServices.ts";
import { useGetGroupMembers, useMyMember } from "@/services/GroupServices.ts";
import { useProposeExpenseDeletionVote, useProposeExpenseEditVote } from "@/services/VoteServices.ts";

import { ModalShell } from "./ModalShell";
import { ExpenseFormFields, type ExpenseFormCopy } from "./NewExpenseModal/ExpenseFormFields";
import { parseExpenseAmount, validateExpenseFields } from "./NewExpenseModal/expenseFormValidation";
import { useExpenseForm } from "./NewExpenseModal/useExpenseForm";

export interface ReportExpenseModalProps {
    readonly groupId: number;
    readonly expense: Expense;
    readonly onClose?: () => void;
}

const REPORT_EXPENSE_COPY: ExpenseFormCopy = {
    receiptHint: "Si no subís un archivo, se mantiene el comprobante actual",
    participantsHint: "Agregá al menos una persona; quien está a cargo es el acreedor y no puede figurar acá",
    creditorHint: "Quien está a cargo no cambia: la plata se le sigue debiendo a esta persona",
    equalSplitNotice: "El gasto se divide en partes iguales entre quien está a cargo y las personas asignadas.",
};

interface DirectChangeConditions {
    readonly isCreator: boolean;
    readonly hasPayments: boolean;
    readonly reachesThreshold: boolean;
}

/**
 * Por qué la modificación tiene que pasar por una votación, o null si el creador puede aplicarla directamente.
 * Espeja las reglas de {@code ExpenseService.updateExpense}.
 */
function findEditVoteReason(
    { isCreator, hasPayments, reachesThreshold }: DirectChangeConditions,
    threshold: number,
): string | null {
    if (!isCreator) {
        return "Solo quien cargó el gasto puede modificarlo directamente: tu propuesta se enviará a votación entre las personas involucradas.";
    }
    if (hasPayments) {
        return "El gasto ya tiene pagos registrados: los cambios se enviarán a votación entre las personas involucradas.";
    }
    if (reachesThreshold) {
        return `El gasto alcanza el umbral de gasto extraordinario del grupo (${formatCurrency(threshold)}): los cambios se enviarán a votación entre las personas involucradas.`;
    }
    return null;
}

export function ReportExpenseModal({ groupId, expense, onClose }: ReportExpenseModalProps): ReactElement {
    const { data: members = [] } = useGetGroupMembers(groupId, "ACTIVE");
    const me = useMyMember(groupId);
    const group = useCurrentGroup();
    const updateExpense = useUpdateExpense(groupId);
    const deleteExpense = useDeleteExpense(groupId);
    const proposeEdit = useProposeExpenseEditVote(groupId);
    const proposeDeletion = useProposeExpenseDeletionVote(groupId);
    const { showSchemaError, showApiError, showSuccessToast, showErrorToast } = useFormToasts();

    const { details } = expense;
    // Los participantes que ya no son miembros activos no figuran entre los asignables: al guardar quedan afuera.
    const form = useExpenseForm({
        title: details.title,
        description: details.description || "",
        amount: String(details.totalAmount),
        splitMethod: details.splitMethod,
        participantIds: new Set(details.participants.map((participant) => participant.member.id)),
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const isEqualDistribution = group.settings.distributionMode === "EQUAL";
    const effectiveSplitMethod: SplitMethod = isEqualDistribution ? "EQUAL" : form.splitMethod;

    const threshold = group.settings.extraordinaryExpenseThreshold;
    const newAmount = parseExpenseAmount(form.amount);
    const isCreator = me !== undefined && expense.creator.id === me.id;

    const editVoteReason = findEditVoteReason(
        {
            isCreator,
            hasPayments: expense.hasPayments,
            reachesThreshold:
                reachesExtraordinaryThreshold(details.totalAmount, threshold) ||
                (newAmount !== null && reachesExtraordinaryThreshold(newAmount, threshold)),
        },
        threshold,
    );
    const changesDirectly = editVoteReason === null;
    // Eliminar solo quita deudas, así que no depende del umbral: alcanza con ser el creador y que nadie haya pagado.
    const deletesDirectly = isCreator && !expense.hasPayments;

    const assignableMembers = members.filter((member) => member.id !== details.creditor.id);
    const participants = assignableMembers.filter((member) => form.participantIds.has(member.id));

    const announceVote = (vote: Vote, pendingTitle: string, pendingDescription: string): void => {
        const resolution = describeResolvedVote(vote);

        if (!resolution) {
            showSuccessToast(pendingTitle, pendingDescription);
        } else if (resolution.kind === "success") {
            showSuccessToast(resolution.title, resolution.description);
        } else {
            showErrorToast(resolution.title, resolution.description);
        }
    };

    const handleSaveChanges = async (): Promise<void> => {
        if (isSubmitting) return;

        const validation = validateExpenseFields({
            title: form.title,
            rawAmount: form.amount,
            participantCount: participants.length,
        });
        if (!validation.isValid) {
            showSchemaError(validation.message);
            return;
        }

        const receiptSource = form.file ?? details.receiptUrl ?? null;
        if (receiptSource === null) {
            showSchemaError("El comprobante (imagen o PDF) es obligatorio");
            return;
        }

        setIsSubmitting(true);
        try {
            const receiptUrl = typeof receiptSource === "string"
                ? receiptSource
                : await uploadExpenseReceipt(receiptSource);

            const payload: ExpenseData = {
                title: form.title.trim(),
                description: form.description.trim(),
                totalAmount: validation.amount,
                splitMethod: effectiveSplitMethod,
                participants: participants.map((member) => ({ memberId: member.id })),
                receiptUrl,
            };

            if (changesDirectly) {
                await updateExpense.mutateAsync({ expenseId: expense.id, payload });
                showSuccessToast("Gasto actualizado");
            } else {
                const vote = await proposeEdit.mutateAsync({ expenseId: expense.id, payload });
                announceVote(vote, "Cambios enviados a votación", "Se aplicarán si lo aprueban las personas involucradas.");
            }

            onClose?.();
        } catch (error) {
            showApiError(
                error as BackendError,
                changesDirectly ? "No se pudo actualizar el gasto" : "No se pudo proponer la modificación",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (deletesDirectly) {
                await deleteExpense.mutateAsync(expense.id);
                showSuccessToast("Gasto eliminado");
            } else {
                const vote = await proposeDeletion.mutateAsync(expense.id);
                announceVote(vote, "Eliminación enviada a votación", "Se eliminará si lo aprueban las personas involucradas.");
            }

            onClose?.();
        } catch (error) {
            showApiError(
                error as BackendError,
                deletesDirectly ? "No se pudo eliminar el gasto" : "No se pudo proponer la eliminación",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitLabel = isSubmitting
        ? "Guardando..."
        : changesDirectly ? "Guardar cambios" : "Proponer cambios sobre el gasto";

    return (
        <ModalShell
            title={isCreator ? "Editar gasto" : "Reportar gasto"}
            submitLabel={submitLabel}
            onClose={onClose}
            onSubmit={(event) => {
                event.preventDefault();
                void handleSaveChanges();
            }}
            secondaryAction={{
                label: deletesDirectly ? "Eliminar gasto" : "Proponer eliminación del gasto",
                variant: "danger",
                disabled: isSubmitting,
                onClick: () => void handleDelete(),
            }}
            modalClassName="max-w-4xl"
        >
            {editVoteReason ? (
                <p className="rounded-xl bg-modal-soft px-4 py-3 text-sm text-modal-ink">{editVoteReason}</p>
            ) : null}

            <ExpenseFormFields
                form={form}
                assignableMembers={assignableMembers}
                creditor={details.creditor}
                isEqualDistribution={isEqualDistribution}
                copy={REPORT_EXPENSE_COPY}
            />
        </ModalShell>
    );
}

export default ReportExpenseModal;
