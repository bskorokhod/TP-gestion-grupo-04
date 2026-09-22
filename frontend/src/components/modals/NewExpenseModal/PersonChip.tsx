import {cn} from "@/lib/cn.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export type ChipTone = "green" | "amber" | "primary";

const toneClasses: Record<ChipTone, string> = {
  green: "bg-group-green/15 text-group-green",
  amber: "bg-group-amber/15 text-group-amber",
  primary: "bg-modal-primary/15 text-modal-primary",
};

interface PersonChipProps {
  initials: string;
  name: string;
  tone?: ChipTone;
  onRemove?: () => void;
}

export function PersonChip({ initials, name, tone = "primary", onRemove }: PersonChipProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm font-medium",
        toneClasses[tone],
      )}
    >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-modal-surface text-[0.625rem] font-medium">
                {initials}
            </span>

            <span className="truncate">
                {name}
            </span>

        {onRemove ? (
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Quitar a ${name}`}
                className="shrink-0 inline-flex items-center justify-center text-xs opacity-70 transition-opacity hover:opacity-100"
            >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" aria-hidden />
            </button>
        ) : null}
        </span>
  );
}

interface ChipButtonProps {
  label: string;
  onClick?: () => void;
}

export function ChipButton({ label, onClick }: ChipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-modal-border bg-modal-surface px-4 py-2 text-sm font-medium text-modal-primary transition-colors hover:bg-modal-field"
    >
      {label}
    </button>
  );
}