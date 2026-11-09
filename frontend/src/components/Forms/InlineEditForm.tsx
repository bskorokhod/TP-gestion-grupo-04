import type { ChangeEvent, KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

import Button from "@/components/Button.tsx";
import {cn} from "@/lib/cn.ts";

interface InlineEditFormProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onConfirm: () => void;
    onCancel: () => void;
    isValid: boolean;
    canConfirm: boolean;
    isSaving: boolean;
    maxLength?: number;
    ariaLabel: string;
    placeholder?: string;
    inputClassName?: string;
}

export function InlineEditForm({
                                   value,
                                   onChange,
                                   onKeyDown,
                                   onConfirm,
                                   onCancel,
                                   isValid,
                                   canConfirm,
                                   isSaving,
                                   maxLength,
                                   ariaLabel,
                                   placeholder,
                                   inputClassName,
                               }: InlineEditFormProps) {
    return (
        <div className="flex min-w-0 flex-1 flex-row gap-2 items-center self-stretch">
            <input
                type="text"
                value={value}
                maxLength={maxLength}
                autoFocus
                disabled={isSaving}
                placeholder={placeholder}
                aria-label={ariaLabel}
                aria-invalid={!isValid}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                className={cn(
                    "min-w-0 flex-1 rounded-lg border bg-input-surface px-3 py-1.5 text-ink outline-none",
                    isValid ? "border-brand" : "border-group-danger",
                    inputClassName
                )}
            />
            <Button
                type="button"
                variant="success"
                size="icon"
                title="Confirmar"
                aria-label="Confirmar cambio"
                disabled={!canConfirm}
                onClick={onConfirm}
            >
                <FontAwesomeIcon icon={faCheck} aria-hidden/>
            </Button>
            <Button
                type="button"
                variant="muted"
                size="icon"
                title="Cancelar"
                aria-label="Cancelar edición"
                disabled={isSaving}
                onClick={onCancel}
            >
                <FontAwesomeIcon icon={faXmark} aria-hidden/>
            </Button>
        </div>
    );
}
