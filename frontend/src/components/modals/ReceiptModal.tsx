import { useId } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/Button.tsx";
import { ExpenseReceiptPreview } from "@/components/Expenses/ExpenseReceiptPreview.tsx";
import { CloseIcon } from "@/components/Icons.tsx";
import { useDismissibleModal } from "./useDismissibleModal";

export interface ReceiptModalProps {
    readonly title: string;
    readonly receiptUrl?: string | null;
    readonly onClose: () => void;
}

export function ReceiptModal({ title, receiptUrl, onClose }: ReceiptModalProps) {
    const titleId = useId();
    useDismissibleModal(onClose);

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={onClose}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                className="max-h-screen w-full max-w-3xl overflow-y-auto rounded-3xl border border-modal-border bg-modal-surface p-6 shadow-2xl sm:p-8"
            >
                <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <h2 id={titleId} className="min-w-0 truncate text-xl font-black text-modal-ink">
                        Comprobante de {title}
                    </h2>
                    <Button
                        type="button"
                        variant="modalIcon"
                        size="modalIcon"
                        aria-label="Cerrar comprobante"
                        onClick={onClose}
                    >
                        <CloseIcon />
                    </Button>
                </header>

                <div className="mt-6">
                    {receiptUrl ? (
                        <ExpenseReceiptPreview url={receiptUrl} title={title} />
                    ) : (
                        <p className="rounded-lg bg-modal-field px-3 py-6 text-center text-sm text-modal-ink">
                            Este gasto no tiene comprobante adjunto.
                        </p>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default ReceiptModal;
