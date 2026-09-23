import {cn} from "@/lib/cn.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import {MemberColor} from "@/models/Group.ts";
import {Avatar} from "@/components/ui/Avatar.tsx";

interface PersonChipProps {
    name: string;
    color?: MemberColor;
    photoUrl?: string | null;
    onRemove?: () => void;
}

export function PersonChip({ name, color, photoUrl, onRemove }: PersonChipProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm font-medium bg-background",)}>
        <Avatar size="sm" name={name} color={color} photoUrl={photoUrl} />

        <span className="truncate">{name}</span>

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