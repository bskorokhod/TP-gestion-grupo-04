import {cn} from "@/lib/cn.ts";

export type SplitMethod =
  | "proportional"
  | "equal"
  | "manual";

const options: ReadonlyArray<{
  value: SplitMethod;
  label: string;
}> = [
  {
    value: "proportional",
    label: "Proporcional",
  },
  {
    value: "equal",
    label: "Equitativo",
  },
  {
    value: "manual",
    label: "Manualmente",
  },
];

interface SplitMethodSelectorProps {
  value: SplitMethod;
  onChange: (value: SplitMethod) => void;
}

export function SplitMethodSelector({
                                      value,
                                      onChange,
                                    }: SplitMethodSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Definir reparto"
      className="flex flex-wrap gap-3"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-6 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-primary/40",
              selected
                ? "border border-modal-primary bg-modal-primary text-modal-primary-foreground"
                : "border border-modal-border bg-modal-surface text-modal-ink hover:bg-modal-field",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}