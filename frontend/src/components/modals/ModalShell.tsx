import { type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button, type ButtonVariant } from "@/components/Button.tsx";
import { CloseIcon } from "@/components/Icons.tsx";
import {cn} from "@/lib/cn.ts";
import { useDismissibleModal } from "./useDismissibleModal";

/** Segundo botón de acción del pie (p. ej. "Eliminar gasto"), entre "Cancelar" y el botón principal. */
export interface ModalSecondaryAction {
    readonly label: string;
    readonly onClick: () => void;
    readonly variant?: ButtonVariant;
    readonly disabled?: boolean;
}

interface ModalShellProps {
    title: string;
    children: ReactNode;
    submitLabel: string;
    onClose?: () => void;
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
    submitClassName?: string;
    modalClassName?: string;
    secondaryAction?: ModalSecondaryAction;
}

export function ModalShell({title, children, submitLabel, onClose, onSubmit, submitClassName, modalClassName, secondaryAction}: ModalShellProps) {
    useDismissibleModal(onClose);

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
                className={cn(modalClassName, "max-h-screen w-full overflow-y-auto rounded-3xl border border-modal-border bg-modal-surface p-6 shadow-2xl sm:p-8")}>
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
                    {secondaryAction && (
                        <Button
                            type="button"
                            variant={secondaryAction.variant ?? "modalSecondary"}
                            size="modal"
                            disabled={secondaryAction.disabled}
                            onClick={secondaryAction.onClick}
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                    <Button type="submit" variant="modalPrimary" size="modal" className={submitClassName}>
                        {submitLabel}
                    </Button>
                </footer>
            </form>
        </div>,
        document.body
    );
}
