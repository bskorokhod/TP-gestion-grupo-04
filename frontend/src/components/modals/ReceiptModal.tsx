import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/Button.tsx";
import { ExpenseReceiptPreview } from "@/components/Expenses/ExpenseReceiptPreview.tsx";
import { CloseIcon } from "@/components/Icons.tsx";
import { cn } from "@/lib/cn.ts";
import { useDismissibleModal } from "./useDismissibleModal";

export interface ReceiptModalProps {
    readonly title: string;
    /** Un único comprobante. Se ignora si viene {@link receiptUrls}. */
    readonly receiptUrl?: string | null;
    /** Varios comprobantes (p. ej. los pagos de una deuda): el modal los muestra de a uno, con un slider. */
    readonly receiptUrls?: readonly string[];
    readonly onClose: () => void;
}

export function ReceiptModal({ title, receiptUrl, receiptUrls, onClose }: ReceiptModalProps) {
    const titleId = useId();
    useDismissibleModal(onClose);

    const receipts: readonly string[] = receiptUrls ?? (receiptUrl ? [receiptUrl] : []);
    const [index, setIndex] = useState<number>(0);

    const count = receipts.length;
    const hasSeveral = count > 1;
    const current = receipts[Math.min(index, Math.max(count - 1, 0))];

    const showPrevious = (): void => setIndex((value) => (value - 1 + count) % count);
    const showNext = (): void => setIndex((value) => (value + 1) % count);

    useEffect(() => {
        if (!hasSeveral) return;

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + count) % count);
            if (event.key === "ArrowRight") setIndex((value) => (value + 1) % count);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hasSeveral, count]);

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

                <div className="mt-6 space-y-4">
                    {current ? (
                        <ExpenseReceiptPreview key={current} url={current} title={title} />
                    ) : (
                        <p className="rounded-lg bg-modal-field px-3 py-6 text-center text-sm text-modal-ink">
                            Este gasto no tiene comprobante adjunto.
                        </p>
                    )}

                    {hasSeveral ? (
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                type="button"
                                variant="modalSecondary"
                                size="icon"
                                aria-label="Comprobante anterior"
                                onClick={showPrevious}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" aria-hidden />
                            </Button>

                            <div className="flex flex-col items-center gap-2">
                                <p className="text-sm font-medium text-modal-ink" aria-live="polite">
                                    Comprobante {index + 1} de {count}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {receipts.map((url, dotIndex) => (
                                        <button
                                            key={url}
                                            type="button"
                                            aria-label={`Ver comprobante ${dotIndex + 1}`}
                                            aria-current={dotIndex === index}
                                            onClick={() => setIndex(dotIndex)}
                                            className={cn(
                                                "size-2 cursor-pointer rounded-full transition-colors",
                                                dotIndex === index ? "bg-modal-primary" : "bg-modal-border hover:bg-modal-primary/50",
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="modalSecondary"
                                size="icon"
                                aria-label="Comprobante siguiente"
                                onClick={showNext}
                            >
                                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" aria-hidden />
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default ReceiptModal;
