import { type FormEvent, useState } from "react";

import TextField from "@/components/Forms/TextField.tsx";
import { ModalShell } from "./ModalShell";
import { JoinGroup, JoinGroupSchema } from "@/models/Group.ts";
import { useFormToasts } from "@/hooks/useFormToasts";
import { getApiErrorStatus } from "@/lib/api.ts";
import { usePreviewGroup } from "@/services/GroupServices.ts";

export interface JoinGroupModalProps {
    onClose?: () => void;
    onJoin?: (data: JoinGroup) => void | Promise<void>;
}

/** "" -> undefined (para que Zod lo reporte como faltante); si no, el número (NaN incluido). */
function parseOptionalNumber(raw: string): number | undefined {
    const trimmed = raw.trim();
    return trimmed === "" ? undefined : Number(trimmed);
}

export function JoinGroupModal({ onClose, onJoin }: JoinGroupModalProps) {
    const { showSchemaError } = useFormToasts();

    const [groupCode, setGroupCode] = useState("");
    const [percentage, setPercentage] = useState("");

    // Con un código bien formado se consulta el grupo para saber su nombre y su modo de reparto.
    const preview = usePreviewGroup(groupCode);
    const group = preview.data;
    const requiresPercentage = group?.distributionMode === "PERCENTAGE";

    const previewErrorMessage = !preview.isError
        ? null
        : getApiErrorStatus(preview.error) === 404
            ? "No existe un grupo con ese código."
            : "No pudimos consultar el grupo. Probá de nuevo en un momento.";

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const data = new FormData(event.currentTarget);

        if (!group) {
            showSchemaError("Ingresá un código de grupo válido para continuar");
            return;
        }

        const payload = {
            joinCode: String(data.get("groupCode") ?? ""),
            nickname: String(data.get("nickname") ?? ""),
            ...(requiresPercentage && { percentage: parseOptionalNumber(percentage) }),
        };

        if (requiresPercentage && payload.percentage === undefined) {
            showSchemaError("Indicá el porcentaje de propiedad que querés tener");
            return;
        }

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

            <div>
                <TextField
                    id="group-code"
                    name="groupCode"
                    label="Código de grupo"
                    placeholder="Ej. ABC-1234-XYZ"
                    centered
                    required
                    autoComplete="off"
                    maxLength={12}
                    value={groupCode}
                    onChange={(event) => setGroupCode(event.target.value)}
                />

                {preview.isFetching && (
                    <p role="status" className="mt-2 text-center text-sm text-modal-muted">
                        Buscando grupo...
                    </p>
                )}
                {!preview.isFetching && group && (
                    <p role="status" className="mt-2 text-center text-sm text-modal-ink">
                        Te vas a unir a <strong>«{group.name}»</strong>
                    </p>
                )}
                {!preview.isFetching && previewErrorMessage && (
                    <p role="alert" className="mt-2 text-center text-sm font-medium text-group-danger">
                        {previewErrorMessage}
                    </p>
                )}
            </div>

            <TextField
                id="nickname"
                name="nickname"
                label="Tu apodo"
                placeholder="Ej. Juan"
                required
                autoComplete="off"
                maxLength={30}
            />

            {requiresPercentage && (
                <TextField
                    id="join-percentage"
                    label="Porcentaje de propiedad que querés tener"
                    hint="Un administrador del grupo debe aprobar tu solicitud con ese porcentaje."
                    type="number"
                    inputMode="decimal"
                    min={0.01}
                    max={100}
                    step={0.01}
                    placeholder="Ej. 25"
                    value={percentage}
                    onChange={(event) => setPercentage(event.target.value)}
                    required
                />
            )}
        </ModalShell>
    );
}

export default JoinGroupModal;
