import type {ReactNode} from "react";

export interface CheckboxProps {
    name?: string;
    children?: ReactNode;
}

export default function Checkbox({name, children}: CheckboxProps) {
    return (
        <label className="flex min-w-0 cursor-pointer items-center gap-2">
            <input type="checkbox" name={name} className="peer sr-only"/>
            <span
                className="h-3.75 w-3.75 shrink-0 border border-field bg-input-surface"
                aria-hidden="true"
            />
            <span>{children}</span>
        </label>
    );
}
