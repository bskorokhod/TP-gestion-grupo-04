import type {SelectHTMLAttributes} from "react";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> {
    id: string;
    label: string;
    options: ReadonlyArray<SelectOption>;
    /** Texto de la opción vacía (no elegible una vez que se eligió algo). */
    placeholder: string;
    hint?: string;
    className?: string;
}

/** Select nativo con el mismo estilo que {@link TextField}. Pensado para uso controlado (`value` + `onChange`). */
export default function SelectField({
    id,
    label,
    options,
    placeholder,
    hint,
    className = "",
    ...selectProps
}: SelectFieldProps) {
    return (
        <div className={className}>
            <label htmlFor={id} className="text-base font-medium text-ink">
                {label}
            </label>
            {hint ? <p className="mt-1 text-xs text-warm-muted">{hint}</p> : null}
            <select
                id={id}
                {...selectProps}
                className="mt-3 h-14 w-full rounded-xl border border-field bg-input-surface px-5 text-base text-warm-muted outline-none transition-shadow focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <option value="" disabled>
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
