import type {FormEvent, InputHTMLAttributes} from "react";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
    id: string;
    label: string;
    hint?: string;
    centered?: boolean;
    className?: string;
}


function spanishValidationMessage(input: HTMLInputElement): string {
    const v = input.validity;
    if (v.valueMissing) return "Completá este campo.";
    if (v.typeMismatch) return "El formato no es válido.";
    if (v.patternMismatch) return "El formato no es válido.";
    if (v.tooShort) return `Ingresá al menos ${input.minLength} caracteres.`;
    if (v.tooLong) return `Ingresá como máximo ${input.maxLength} caracteres.`;
    if (v.rangeUnderflow) return `El valor mínimo es ${input.min}.`;
    if (v.rangeOverflow) return `El valor máximo es ${input.max}.`;
    if (v.stepMismatch) return "El valor no es válido.";
    if (v.badInput) return "Ingresá un valor válido.";
    return "Revisá este campo.";
}

export default function TextField({id, label, hint, centered = false, className = "", onInvalid, onInput, ...inputProps}: TextFieldProps) {
    function handleInvalid(event: FormEvent<HTMLInputElement>) {
        event.currentTarget.setCustomValidity(spanishValidationMessage(event.currentTarget));
        onInvalid?.(event);
    }

    function handleInput(event: FormEvent<HTMLInputElement>) {
        event.currentTarget.setCustomValidity("");
        onInput?.(event);
    }

    return (
        <div className={className}>
            <label
                htmlFor={id}
                className={`text-base font-medium text-ink ${centered ? "block text-center" : ""}`}
            >
                {label}
            </label>
            {hint ? <p className="mt-1 text-xs text-warm-muted">{hint}</p> : null}
            <input
                id={id}
                {...inputProps}
                onInvalid={handleInvalid}
                onInput={handleInput}
                className={`mt-3 h-14 w-full rounded-xl border border-field bg-input-surface px-5 text-base text-warm-muted outline-none transition-shadow focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60 ${centered ? "text-center" : ""}`}
            />
        </div>
    );
}
