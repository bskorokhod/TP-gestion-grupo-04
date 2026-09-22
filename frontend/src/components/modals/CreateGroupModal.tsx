import { type FormEvent } from "react";

import TextField from "@/components/Forms/TextField.tsx";
import { ModalShell } from "@/components/modals/ModalShell.tsx";
import { GroupCreate, GroupCreateSchema } from "@/models/Group.ts";
import { useFormToasts } from "@/hooks/useFormToasts";

export interface CreateGroupModalProps {
    onClose: () => void;
    onCreate: (data: GroupCreate) => void | Promise<void>;
}

export const CreateGroupModal = ({ onClose, onCreate }: CreateGroupModalProps) => {
    const { showSchemaError } = useFormToasts();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const rawName = formData.get("groupName")?.toString().trim() ?? "";
        const rawDescription = formData.get("description")?.toString().trim() ?? "";
        const rawFounderNickname = formData.get("founderNickname")?.toString().trim() ?? "";

        const payload: GroupCreate = {
            name: rawName,
            description: rawDescription,
            ...(rawFounderNickname && { founderNickname: rawFounderNickname }),
        };

        const result = GroupCreateSchema.safeParse(payload);
        if (!result.success) {
            showSchemaError(result.error.issues[0]?.message ?? "Revisá los datos");
            return;
        }

        await onCreate(result.data);
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
                maxLength={30}
            />
            <TextField
                id="group-description"
                name="description"
                label="Descripción"
                placeholder="Ej. Gastos compartidos de la casa"
                required
                autoComplete="off"
                maxLength={500}
            />
            <TextField
                id="founder-nickname"
                name="founderNickname"
                label="Tu apodo (opcional)"
                placeholder="Ej. Juan"
                autoComplete="off"
                maxLength={30}
            />
        </ModalShell>
    );
};

export default CreateGroupModal;