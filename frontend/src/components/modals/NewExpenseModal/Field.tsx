import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-modal-ink">
        {label}
      </label>

      {hint ? (
        <p className="-mt-1 text-xs font-normal text-modal-muted">
          {hint}
        </p>
      ) : null}

      {children}
    </div>
  );
}