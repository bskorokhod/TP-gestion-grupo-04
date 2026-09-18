import type { FormEvent } from "react";

import TextField from "@/components/TextField.tsx";
import { ModalShell } from "./ModalShell";

export interface PayDebtModalProps {
    debtAmount?: number;
    onClose?: () => void;
    onPay?: (amount: number) => void;
}

export function PayDebtModal({ debtAmount = 7000, onClose, onPay }: PayDebtModalProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onPay?.(Number(data.get("paymentAmount") ?? 0));
    }

    return (
        <ModalShell
            title="Pagar deuda"
            submitLabel="Pagar deuda"
            onClose={onClose}
            onSubmit={handleSubmit}
        >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <p className="min-w-0 text-base font-medium text-modal-ink">Monto de la deuda</p>
                <p className="shrink-0 text-2xl font-medium text-modal-amount">${debtAmount}</p>
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
        </ModalShell>
    );
}

export default PayDebtModal;