import { useState, type FormEvent } from "react";

import TextField from "@/components/Forms/TextField.tsx";
import FileField from "@/components/Forms/FileField";
import { ModalShell } from "./ModalShell";

import { useMarkDebtAsPaid } from "@/services/ExpenseServices.ts";

export interface PayDebtModalProps {
    groupId: number;
    expenseId: number;
    debtId: number;
    debtAmount: number;
    onClose?: () => void;
    onPaid?: () => void;
}

export function PayDebtModal({
                                 groupId,
                                 expenseId,
                                 debtId,
                                 debtAmount,
                                 onClose,
                                 onPaid,
                             }: PayDebtModalProps) {
    const [receipt, setReceipt] = useState<File | null>(null);
    const [receiptError, setReceiptError] = useState(false);
    const markAsPaid = useMarkDebtAsPaid();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!receipt) {
            setReceiptError(true);
            return;
        }

        const data = new FormData(event.currentTarget);
        const amount = Number(data.get("paymentAmount") ?? 0);

        markAsPaid.mutate(
            { groupId, expenseId, debtId, amount, receipt },
            {
                onSuccess: () => {
                    onPaid?.();
                    onClose?.();
                },
            },
        );
    };

    return (
        <ModalShell
            title="Pagar deuda"
            submitLabel={markAsPaid.isPending ? "Enviando…" : "Pagar deuda"}
            onClose={onClose}
            onSubmit={handleSubmit}
        >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <p className="min-w-0 text-base font-medium text-modal-ink">Monto de la deuda</p>
                <p className="shrink-0 text-2xl font-medium text-modal-amount">
                    ${debtAmount}
                </p>
            </div>

            <TextField
                id="payment-amount"
                name="paymentAmount"
                type="number"
                min={0}
                max={debtAmount}
                step="0.01"
                label="Monto a pagar"
                hint="Podés pagar un monto menor o igual al total de la deuda actual."
                placeholder="$ 0"
                required
            />

            <FileField
                id="payment-receipt"
                label="Comprobante de pago"
                hint="Adjuntá una imagen o PDF del comprobante."
                accept="image/*,application/pdf"
                onChange={(event) => {
                    setReceipt(event.target.files?.[0] ?? null);
                    setReceiptError(false);
                }}
            />

            {receiptError && (
                <p className="text-sm font-medium text-group-danger">
                    Necesitás adjuntar el comprobante de pago.
                </p>
            )}
        </ModalShell>
    );
}

export default PayDebtModal;