export default function TextField({id, label, hint, centered = false, className = "", ...inputProps}) {
    return (
        <div className={className}>
            <label
                htmlFor={id}
                className={`text-sm font-medium text-ink ${centered ? "block text-center" : ""}`}
            >
                {label}
            </label>
            {hint ? <p className="mt-1 text-xs text-warm-muted">{hint}</p> : null}
            <input
                id={id}
                {...inputProps}
                className={`mt-3 h-14 w-full rounded-xl border border-field bg-input-surface px-5 text-[14px] text-ink outline-none transition-shadow placeholder:text-placeholder focus:ring-2 focus:ring-brand/25 ${centered ? "text-center" : ""}`}
            />
        </div>
    );
}
