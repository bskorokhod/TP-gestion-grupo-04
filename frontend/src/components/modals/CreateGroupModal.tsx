import type { FormEvent } from "react";

import TextField from "@/components/Forms/TextField.tsx";
import { ModalShell } from "./ModalShell";

export interface CreateGroupModalProps {
    onClose?: () => void;
    onCreate?: (name: string) => void;
}

export function CreateGroupModal({ onClose, onCreate }: CreateGroupModalProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onCreate?.(String(data.get("groupName") ?? ""));
    }

    return (
        <ModalShell
            title="Crear grupo"
            submitLabel="Crear grupo"
            onClose={onClose}
            onSubmit={handleSubmit}
        >
            <TextField
                id="group-name"
                name="groupName"
                label="Nombre del grupo"
                placeholder="Ej. Casa de la playa"
                required
                autoComplete="off"
            />
        </ModalShell>
    );
}

export default CreateGroupModal;