import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";

import type {SelectOption} from "@/components/Forms/SelectField.tsx";

export interface FilterSelectProps {
    id: string;
    label: string;
    options: ReadonlyArray<SelectOption>;
    value: string;
    onChange: (value: string) => void;
}

export default function FilterSelect({id, label, options, value, onChange}: FilterSelectProps) {
    const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

    return (
        <div className="relative flex items-center gap-2 rounded-full border border-warm-muted bg-panel px-5 py-2.5 focus-within:ring-2 focus-within:ring-brand/25">
            <span className="text-xs font-medium">{label}: {selectedLabel}</span>
            <FontAwesomeIcon icon={faChevronDown} className="size-2.5 text-texto-principal/60" aria-hidden />
            <select
                id={id}
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
