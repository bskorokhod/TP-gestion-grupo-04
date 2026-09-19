import { useEffect, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/Button.tsx";
import { CloseIcon } from "@/components/Icons.tsx";

interface ModalShellProps {
    title: string;
    children: ReactNode;
    submitLabel: string;
    onClose?: () => void;
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
    submitClassName?: string;
}

export function ModalShell({
                               title,
                               children,
                               submitLabel,
                               onClose,
                               onSubmit,
                               submitClassName,
                           }: ModalShellProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && onClose) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={onClose}
        >
            <form
                onSubmit={onSubmit}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-120 overflow-hidden rounded-3xl border border-modal-border bg-modal-surface p-6 shadow-2xl sm:p-8"
            >
                <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <h2 id="modal-title" className="min-w-0 truncate text-xl font-black text-modal-ink">
                        {title}
                    </h2>
                    <Button
                        type="button"
                        variant="modalIcon"
                        size="modalIcon"
                        aria-label={`Cerrar ${title.toLowerCase()}`}
                        onClick={onClose}
                    >
                        <CloseIcon />
                    </Button>
                </header>

                <div className="mt-6 flex flex-col gap-6">{children}</div>

                <footer className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="modalSecondary" size="modal" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="modalPrimary" size="modal" className={submitClassName}>
                        {submitLabel}
                    </Button>
                </footer>
            </form>
        </div>,
        document.body
    );
}