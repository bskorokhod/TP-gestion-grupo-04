export default function Checkbox({name, children}) {
    return (
        <label className="flex min-w-0 cursor-pointer items-center gap-2">
            <input type="checkbox" name={name} className="peer sr-only"/>
            <span
                className="h-[15px] w-[15px] shrink-0 border border-field bg-input-surface peer-checked:bg-brand"
                aria-hidden="true"
            />
            <span>{children}</span>
        </label>
    );
}