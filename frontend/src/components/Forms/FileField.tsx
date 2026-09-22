import type { InputHTMLAttributes } from "react";

export interface FileFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    hint?: string;
    centered?: boolean;
}

export default function FileField({ id, label, hint, centered = false, className = "", ...inputProps }: FileFieldProps) {
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
                type="file"
                {...inputProps}
                className={`mt-3 w-full rounded-xl border border-field bg-input-surface py-4 px-5 text-base text-warm-muted outline-none transition-shadow focus:ring-2 focus:ring-brand/25 ${centered ? "text-center" : ""}`}
            />
        </div>
    );
}