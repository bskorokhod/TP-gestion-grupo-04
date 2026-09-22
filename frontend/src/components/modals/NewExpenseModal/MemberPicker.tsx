import type {Member} from "@/models/Group.ts";

interface MemberPickerProps {
  members: Member[];
  onSelect: (member: Member) => void;
  onClose: () => void;
  emptyLabel: string;
}

export function MemberPicker({
                                members,
                                onSelect,
                                onClose,
                                emptyLabel,
                              }: MemberPickerProps) {
  return (
    <div className="w-full rounded-xl border border-modal-border bg-modal-field p-2">
      {members.length === 0 ? (
        <p className="px-2 py-2 text-sm text-modal-muted">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {members.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => onSelect(member)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-modal-ink transition-colors hover:bg-modal-soft"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-modal-surface text-[0.625rem] font-medium">
                  {member.nickname.slice(0, 2).toUpperCase()}
                </span>

                <span className="truncate">
                  {member.nickname}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-1 w-full rounded-lg px-3 py-1.5 text-center text-xs font-medium text-modal-primary hover:underline"
      >
        Cerrar
      </button>
    </div>
  );
}
