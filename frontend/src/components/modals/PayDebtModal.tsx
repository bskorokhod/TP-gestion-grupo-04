import { useState, type ChangeEvent, type FormEvent } from "react";

import TextField from "@/components/Forms/TextField.tsx";
import FileField from "@/components/Forms/FileField";
import { ModalShell } from "./ModalShell";

import { formatAmount, parseAmount } from "@/lib/format.ts";
import { useMarkDebtAsPaid } from "@/services/ExpenseServices.ts";

export interface PayDebtModalProps {
    groupId: number;
    expenseId: number;
    debtId: number;
    debtAmount: number;
    onClose?: () => void;
    onPaid?: () => void;
}

export function PayDebtModal({groupId, expenseId, debtId, debtAmount, onClose, onPaid,}: PayDebtModalProps) {
    const [receipt, setReceipt] = useState<File | null>(null);
    const [receiptError, setReceiptError] = useState(false);
    const [paymentValue, setPaymentValue] = useState<string>(formatAmount(debtAmount));
    const [amountError, setAmountError] = useState<string | null>(null);
    const markAsPaid = useMarkDebtAsPaid();

    const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPaymentValue(event.target.value.replace(/[^\d.,]/g, ""));
        setAmountError(null);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const amount = parseAmount(paymentValue);
        if (!Number.isFinite(amount) || amount <= 0) {
            setAmountError("Ingresá un monto válido, con hasta 2 decimales.");
            return;
        }
        if (Math.round(amount * 100) > Math.round(debtAmount * 100)) {
            setAmountError(`El monto no puede superar $${formatAmount(debtAmount)}.`);
            return;
        }

        if (!receipt) {
            setReceiptError(true);
            return;
        }

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
            modalClassName="max-w-lg"
        >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <p className="min-w-0 text-base font-medium text-modal-ink">Monto de la deuda</p>
                <p className="shrink-0 text-2xl font-medium text-modal-amount">
                    ${formatAmount(debtAmount)}
                </p>
            </div>

            <TextField
                id="payment-amount"
                name="paymentAmount"
                type="text"
                inputMode="decimal"
                step="0.01"
                label="Monto a pagar"
                hint="Podés pagar un monto menor o igual al total de la deuda actual."
                placeholder="$ 0"
                value={paymentValue}
                onChange={handleAmountChange}
                required
            />

            {amountError && (
                <p className="text-sm font-medium text-group-danger">{amountError}</p>
            )}

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
