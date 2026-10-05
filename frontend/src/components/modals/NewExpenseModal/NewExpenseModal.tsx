import { useState, type ReactElement } from "react";

import { ModalShell } from "@/components/modals/ModalShell";
import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { useFormToasts } from "@/hooks/useFormToasts.ts";
import type { BackendError } from "@/hooks/useToast.ts";
import { formatCurrency } from "@/lib/format.ts";
import { uploadExpenseReceipt } from "@/lib/supabase.ts";
import { describeResolvedVote, reachesExtraordinaryThreshold } from "@/lib/votes.ts";
import type { SplitMethod } from "@/models/Expense.ts";
import { useGetGroupMembers, useMyMember } from "@/services/GroupServices.ts";
import { useCreateExpense } from "@/services/ExpenseServices.ts";
import { useCreateExtraordinaryExpenseVote } from "@/services/VoteServices.ts";

import { ExpenseFormFields, type ExpenseFormCopy } from "./ExpenseFormFields";
import { parseExpenseAmount, validateExpenseFields } from "./expenseFormValidation";
import { useExpenseForm } from "./useExpenseForm";


export interface NewExpenseModalProps {
    readonly groupId: number;
    readonly onClose?: () => void;
}

const NEW_EXPENSE_COPY: ExpenseFormCopy = {
    receiptHint: "Arrastrá el archivo o elegilo desde tu dispositivo",
    participantsHint: "Agregá al menos una persona; vos quedás como acreedor/a y no podés figurar acá",
    creditorHint: "El gasto queda a tu nombre: la plata se te debe a vos",
    equalSplitNotice: "El gasto se divide en partes iguales entre vos y las personas asignadas.",
};

export function NewExpenseModal({groupId, onClose,}: NewExpenseModalProps): ReactElement {
    const { data: members = [] } = useGetGroupMembers(groupId, "ACTIVE");
    const me = useMyMember(groupId);
    const createExpense = useCreateExpense(groupId);
    const createExpenseVote = useCreateExtraordinaryExpenseVote(groupId);
    const group = useCurrentGroup();
    const { showSchemaError, showApiError, showSuccessToast, showErrorToast } = useFormToasts();

    const form = useExpenseForm({
        title: "",
        description: "",
        amount: "",
        splitMethod: "PROPORTIONAL",
        participantIds: new Set<number>(),
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const isEqualDistribution = group.settings.distributionMode === "EQUAL";
    // En un grupo EQUAL el reparto proporcional no existe: el método elegido en el estado se ignora.
    const effectiveSplitMethod: SplitMethod = isEqualDistribution ? "EQUAL" : form.splitMethod;

    const threshold = group.settings.extraordinaryExpenseThreshold;
    const previewAmount = parseExpenseAmount(form.amount);
    const requiresVote = previewAmount !== null && reachesExtraordinaryThreshold(previewAmount, threshold);

    const assignableMembers = me ? members.filter((member) => member.id !== me.id) : [];
    const participants = assignableMembers.filter((member) => form.participantIds.has(member.id));

    const handleSubmit = async (): Promise<void> => {
        const validation = validateExpenseFields({
            title: form.title,
            rawAmount: form.amount,
            participantCount: participants.length,
        });
        if (!validation.isValid) {
            showSchemaError(validation.message);
            return;
        }

        if (!form.file) {
            showSchemaError("El comprobante (imagen o PDF) es obligatorio");
            return;
        }

        if (!me) {
            showSchemaError("No pudimos identificar tu membresía en este grupo");
            return;
        }

        setIsSubmitting(true);
        try {
            const receiptUrl = await uploadExpenseReceipt(form.file);

            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                totalAmount: validation.amount,
                splitMethod: effectiveSplitMethod,
                participants: participants.map((member) => ({ memberId: member.id })),
                receiptUrl,
            };

            if (reachesExtraordinaryThreshold(validation.amount, threshold)) {
                // Gasto extraordinario: no se crea; se propone y se registra solo si la votación se aprueba.
                const vote = await createExpenseVote.mutateAsync(payload);
                const resolution = describeResolvedVote(vote);

                if (!resolution) {
                    showSuccessToast("Gasto enviado a votación", "Se registrará si lo aprueban las personas involucradas.");
                } else if (resolution.kind === "success") {
                    showSuccessToast("Gasto registrado", resolution.description);
                } else {
                    showErrorToast(resolution.title, resolution.description);
                }
            } else {
                await createExpense.mutateAsync(payload);
                showSuccessToast("Gasto registrado");
            }

            onClose?.();
        } catch (error) {
            showApiError(error as BackendError, "No se pudo registrar el gasto");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalShell
            title="Nuevo gasto"
            submitLabel={isSubmitting ? "Guardando..." : requiresVote ? "Enviar a votación" : "Guardar gasto"}
            onClose={onClose}
            onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
            }}
            modalClassName="max-w-4xl"
        >
            <ExpenseFormFields
                form={form}
                assignableMembers={assignableMembers}
                creditor={me}
                isEqualDistribution={isEqualDistribution}
                copy={NEW_EXPENSE_COPY}
                amountNotice={requiresVote ? (
                    <p className="mt-2 rounded-xl bg-modal-soft px-4 py-3 text-sm text-modal-ink">
                        Este gasto alcanza el umbral de gasto extraordinario del grupo ({formatCurrency(threshold)}).
                        No se registrará de inmediato: se enviará a votación entre las personas involucradas.
                    </p>
                ) : null}
            />
        </ModalShell>
    );
}

export default NewExpenseModal;
