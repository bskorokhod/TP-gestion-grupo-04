import type { FormEvent } from "react";

import TextField from "@/components/TextField.tsx";
import { ModalShell } from "./ModalShell";

export interface JoinGroupModalProps {
    onClose?: () => void;
    onJoin?: (code: string) => void;
}

export function JoinGroupModal({ onClose, onJoin }: JoinGroupModalProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onJoin?.(String(data.get("groupCode") ?? ""));
    }

    return (
        <ModalShell
            title="Unirme a grupo"
            submitLabel="Unirme"
            submitClassName="sm:px-12"
            onClose={onClose}
            onSubmit={handleSubmit}
        >
            <p className="text-xs text-modal-muted">
                Ingresá el código que te compartió el administrador del grupo.
            </p>
            <TextField
                id="group-code"
                name="groupCode"
                label="Código de grupo"
                placeholder="Ej. GRP-2026-XK9"
                centered
                required
                autoComplete="off"
            />
        </ModalShell>
    );
}

export default JoinGroupModal;