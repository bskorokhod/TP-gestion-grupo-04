import type { FormEvent, ReactNode } from "react";

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
    return (
        <form
            onSubmit={onSubmit}
            className="w-full max-w-120 overflow-hidden rounded-3xl border border-modal-border bg-modal-surface p-6 shadow-2xl sm:p-8"
        >
            <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <h2 className="min-w-0 truncate text-xl font-black text-modal-ink">{title}</h2>
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
    );
}