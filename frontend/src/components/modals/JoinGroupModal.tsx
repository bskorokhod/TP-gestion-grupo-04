import { type FormEvent } from "react";

import TextField from "@/components/Forms/TextField.tsx";
import { ModalShell } from "./ModalShell";
import { JoinGroup, JoinGroupSchema } from "@/models/Group.ts";
import { useFormToasts } from "@/hooks/useFormToasts";

export interface JoinGroupModalProps {
    onClose?: () => void;
    onJoin?: (data: JoinGroup) => void | Promise<void>;
}

export function JoinGroupModal({ onClose, onJoin }: JoinGroupModalProps) {
    const { showSchemaError } = useFormToasts();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const data = new FormData(event.currentTarget);
        const payload: JoinGroup = {
            joinCode: String(data.get("groupCode") ?? ""),
            nickname: String(data.get("nickname") ?? ""),
        };

        const result = JoinGroupSchema.safeParse(payload);
        if (!result.success) {
            showSchemaError(result.error.issues[0]?.message ?? "Revisá los datos");
            return;
        }

        await onJoin?.(result.data);
    }

    return (
        <ModalShell
            title="Unirme a grupo"
            submitLabel="Unirme"
            submitClassName="sm:px-12"
            onClose={onClose}
            onSubmit={handleSubmit}
            modalClassName="max-w-lg"
        >
            <p className="text-base text-modal-muted">
                Ingresá el código que te compartió el administrador del grupo.
            </p>

            <TextField
                id="group-code"
                name="groupCode"
                label="Código de grupo"
                placeholder="Ej. ABC-1234-XYZ"
                centered
                required
                autoComplete="off"
                maxLength={12}
            />

            <TextField
                id="nickname"
                name="nickname"
                label="Tu apodo"
                placeholder="Ej. Juan"
                required
                autoComplete="off"
                maxLength={30}
            />
        </ModalShell>
    );
}

export default JoinGroupModal;