import type {InputHTMLAttributes} from "react";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
    id: string;
    label: string;
    hint?: string;
    centered?: boolean;
    className?: string;
}

export default function TextField({id, label, hint, centered = false, className = "", ...inputProps}: TextFieldProps) {
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
                className={`mt-3 h-14 w-full rounded-xl border border-field bg-input-surface px-5 text-base text-warm-muted outline-none transition-shadow focus:ring-2 focus:ring-brand/25 ${centered ? "text-center" : ""}`}
            />
        </div>
    );
}
