import type {SelectHTMLAttributes} from "react";
import {DropdownSelect} from "@/components/Forms/DropdownSelect.tsx";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children" | "onChange" | "value"> {
    id: string;
    label: string;
    options: ReadonlyArray<SelectOption>;
    /** Texto de la opción vacía (no elegible una vez que se eligió algo). */
    placeholder: string;
    hint?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
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
            <DropdownSelect
                id={id}
                options={[{value: "", label: placeholder, disabled: true}, ...options]}
                value={selectProps.value?.toString() ?? ""}
                onChange={(value) => selectProps.onChange?.(value)}
                disabled={selectProps.disabled}
                className="mt-3"
            />
        </div>
    );
}
