import { useState, type FormEvent } from "react";

import TextField from "@/components/Forms/TextField.tsx";
import { ModalShell } from "./ModalShell";
import { JoinGroup, JoinGroupSchema } from "@/models/Group.ts";

export interface JoinGroupModalProps {
    onClose?: () => void;
    onJoin?: (data: JoinGroup) => void | Promise<void>;
}

export function JoinGroupModal({ onClose, onJoin }: JoinGroupModalProps) {
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const data = new FormData(event.currentTarget);
        const payload: JoinGroup = {
            joinCode: String(data.get("groupCode") ?? ""),
            nickname: String(data.get("nickname") ?? ""),
        };

        const result = JoinGroupSchema.safeParse(payload);

        if (!result.success) {
            setError(result.error.issues[0]?.message ?? "Datos inválidos");
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
            {error && (
                <p role="alert" className="text-sm font-medium text-red-600">
                    {error}
                </p>
            )}
        </ModalShell>
    );
}

export default JoinGroupModal;