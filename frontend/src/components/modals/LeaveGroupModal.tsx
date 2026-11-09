import { type FormEvent } from "react";
import { useLocation } from "wouter";

import { ModalShell } from "./ModalShell";
import { groupExpensesPath, GROUPS_PATH } from "@/constants/routes.ts";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorStatus } from "@/lib/api.ts";
import { apiErrorCode } from "@/lib/apiErrors.ts";
import { GROUP_STOPPED_CONSEQUENCE, missingPercentageText } from "@/constants/group.ts";
import { useFormToasts } from "@/hooks/useFormToasts.ts";
import { formatCurrency } from "@/lib/format.ts";
import { useGetLeavePreview, useLeaveGroup } from "@/services/GroupServices.ts";

const LEAVE_ERROR_OVERRIDES = {
    403: "Ya no formás parte de este grupo.",
    404: "Ya no formás parte de este grupo o el grupo no existe.",
};

export interface LeaveGroupModalProps {
    groupId: number;
    groupCode: string;
    groupName: string;
    onClose: () => void;
}

/**
 * Abandonar el grupo. Al abrirse consulta el leave-preview y según la respuesta muestra: el bloqueo por deudas propias
 * (sin posibilidad de confirmar), la advertencia de lo que se pierde, o la confirmación simple.
 */
export function LeaveGroupModal({ groupId, groupCode, groupName, onClose }: LeaveGroupModalProps) {
    const [, navigate] = useLocation();
    const preview = useGetLeavePreview(groupId);
    const leave = useLeaveGroup(groupId);
    const qc = useQueryClient();
    const { showSuccessToast, showErrorToast, showApiError } = useFormToasts();

    const data = preview.data;

    function confirmLeave() {
        leave.mutate(undefined, {
            onSuccess: () => {
                navigate(GROUPS_PATH);
                showSuccessToast("Abandonaste el grupo", `Ya no formás parte de ${groupName}.`);
            },
            onError: (error) => {
                if (getApiErrorStatus(error) === 409) {
                    const code = apiErrorCode(error);
                    if (code === null || code === "DEBTS_UNSETTLED") {
                        void preview.refetch();
                        showErrorToast("Tus deudas cambiaron", "Tus deudas cambiaron, revisá la información actualizada.");
                        return;
                    }
                    // Otro motivo (p. ej. grupo detenido): no tiene que ver con las deudas, así que no se refresca el preview.
                    showApiError(error, "No se pudo abandonar el grupo");
                    if (code === "NOT_ACTIVE_MEMBER") {
                        // Ya no es miembro: se limpia lo del grupo y se lo saca de acá.
                        qc.removeQueries({ queryKey: ["groups", groupId] });
                        void qc.invalidateQueries({ queryKey: ["groups"] });
                        navigate(GROUPS_PATH);
                    }
                    return;
                }
                showApiError(error, "No se pudo abandonar el grupo", LEAVE_ERROR_OVERRIDES);
            },
        });
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!data) return;
        if (data.hasUnsettledDebts) {
            onClose();
            navigate(groupExpensesPath(groupCode));
            return;
        }
        confirmLeave();
    }

    if (data?.hasUnsettledDebts) {
        return (
            <ModalShell title="No podés abandonar el grupo" submitLabel="Ir a mis deudas" onClose={onClose} onSubmit={handleSubmit} modalClassName="max-w-lg">
                <p className="text-base text-modal-ink">Primero saldá tus deudas para poder abandonar el grupo.</p>
            </ModalShell>
        );
    }

    const owesNothingButIsOwed = data != null && data.owedToMeTotal > 0;
    const submitLabel = leave.isPending
        ? "Abandonando…"
        : owesNothingButIsOwed
            ? "Abandonar igual"
            : "Abandonar grupo";

    return (
        <ModalShell
            title="Abandonar grupo"
            submitLabel={submitLabel}
            submitClassName="bg-group-danger border-group-danger hover:bg-group-danger/90"
            onClose={onClose}
            onSubmit={handleSubmit}
            isSubmitting={data == null || preview.isError || preview.isRefetchError || preview.isFetching || leave.isPending}
            modalClassName="max-w-lg"
        >
            {preview.isError || preview.isRefetchError ? (
                <p className="text-base text-group-danger">No pudimos verificar tus deudas. Cerrá este cartel e intentá de nuevo.</p>
            ) : data == null ? (
                <p className="text-base text-modal-ink/70">Verificando tus deudas…</p>
            ) : (
                <>
                {data.groupWillStop && (
                    <div role="alert" className="rounded-xl border border-group-danger/20 bg-group-danger-soft px-4 py-3 text-sm text-group-danger">
                        <p className="font-semibold">El grupo va a quedar detenido.</p>
                        <p>{missingPercentageText(data.missingPercentage)}. {GROUP_STOPPED_CONSEQUENCE}</p>
                    </div>
                )}
                {owesNothingButIsOwed ? (
                <>
                    <p className="text-base text-modal-ink">
                        Si te vas perdés <strong>{formatCurrency(data.owedToMeTotal)}</strong> que te deben.
                    </p>
                    <ul className="flex flex-col gap-2">
                        {data.owedToMe.map((d) => (
                            <li key={d.debtorMemberId} className="flex justify-between gap-4 rounded-xl bg-modal-field px-4 py-2 text-sm text-modal-ink">
                                <span>{d.debtorNickname}</span>
                                <span className="font-semibold">{formatCurrency(d.amount)}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-sm text-modal-ink/70">Esas deudas quedarán canceladas.</p>
                </>
            ) : (
                <p className="text-base text-modal-ink">¿Seguro que querés abandonar {groupName}? Dejás de formar parte del grupo.</p>
            )}
                </>
            )}
        </ModalShell>
    );
}

export default LeaveGroupModal;
