import {DropdownSelect} from "@/components/Forms/DropdownSelect.tsx";
import type {SelectOption} from "@/components/Forms/SelectField.tsx";

export interface FilterSelectProps {
    id: string;
    label: string;
    options: ReadonlyArray<SelectOption>;
    value: string;
    onChange: (value: string) => void;
}

export default function FilterSelect({id, label, options, value, onChange}: FilterSelectProps) {
    return (
        <DropdownSelect id={id} aria-label={label} options={options} value={value} onChange={onChange} className="min-w-36" />
    );
}
