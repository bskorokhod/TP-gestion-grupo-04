import {type FormEvent, type ReactNode, useState} from "react";

import SelectField, {type SelectOption} from "@/components/Forms/SelectField.tsx";
import TextField from "@/components/Forms/TextField.tsx";
import {ModalShell} from "@/components/modals/ModalShell.tsx";
import {type DistributionMode, type GroupCreate, GroupCreateSchema, isReservationPolicyAllowed, isVotingModelAllowed,
    MAX_FIXED_DAYS_PER_MONTH, MIN_FIXED_DAYS_PER_MONTH, type ReservationLimitPolicy, type VotingModel} from "@/models/Group.ts";
import {useFormToasts} from "@/hooks/useFormToasts";
import {DISTRIBUTION_OPTIONS, REQUIRES_PERCENTAGE_NOTE, RESERVATION_OPTIONS, VOTING_OPTIONS} from "@/constants/config_modals.ts";

export interface CreateGroupModalProps {
    onClose: () => void;
    onCreate: (data: GroupCreate) => void | Promise<void>;
}

/** "" -> undefined (para que Zod lo reporte como faltante); si no, el número (NaN incluido). */
function parseOptionalNumber(raw: string): number | undefined {
    const trimmed = raw.trim();
    return trimmed === "" ? undefined : Number(trimmed);
}

interface FormSectionProps {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly children: ReactNode;
}

function FormSection({id, title, description, children}: FormSectionProps) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-6">
            <div>
                <h3 id={id} className="text-sm font-bold uppercase tracking-wide text-modal-primary">
                    {title}
                </h3>
                <p className="mt-1 text-xs text-modal-muted">{description}</p>
            </div>
            {children}
        </section>
    );
}

export const CreateGroupModal = ({ onClose, onCreate }: CreateGroupModalProps) => {
    const { showSchemaError } = useFormToasts();

    const [distribution, setDistribution] = useState<DistributionMode | "">("");
    const [voting, setVoting] = useState<VotingModel | "">("");
    const [reservation, setReservation] = useState<ReservationLimitPolicy | "">("");
    const [fixedDays, setFixedDays] = useState("");
    const [threshold, setThreshold] = useState("");
    const [founderPercentage, setFounderPercentage] = useState("");

    const settingsLocked = distribution === "";
    const requiresFounderPercentage = distribution === "PERCENTAGE";

    function handleDistributionChange(next: DistributionMode) {
        setDistribution(next);
        if (voting !== "" && !isVotingModelAllowed(next, voting)) setVoting("");
        if (reservation !== "" && !isReservationPolicyAllowed(next, reservation)) {
            setReservation("");
            setFixedDays("");
        }
        // El porcentaje del fundador solo existe en el reparto porcentual.
        if (next !== "PERCENTAGE") setFounderPercentage("");
    }

    function handleReservationChange(next: ReservationLimitPolicy) {
        setReservation(next);
        if (next !== "FIXED_DAYS_PER_MONTH") setFixedDays("");
    }

    const votingOptions: SelectOption[] = VOTING_OPTIONS.map(({ value, label }) => {
        const allowed = distribution === "" || isVotingModelAllowed(distribution, value);
        return { value, label: allowed ? label : label + REQUIRES_PERCENTAGE_NOTE, disabled: !allowed };
    });

    const reservationOptions: SelectOption[] = RESERVATION_OPTIONS.map(({ value, label }) => {
        const allowed = distribution === "" || isReservationPolicyAllowed(distribution, value);
        return { value, label: allowed ? label : label + REQUIRES_PERCENTAGE_NOTE, disabled: !allowed };
    });

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const rawName = formData.get("groupName")?.toString().trim() ?? "";
        const rawDescription = formData.get("description")?.toString().trim() ?? "";
        const rawFounderNickname = formData.get("founderNickname")?.toString().trim() ?? "";

        const payload = {
            name: rawName,
            description: rawDescription,
            ...(rawFounderNickname && { founderNickname: rawFounderNickname }),
            ...(requiresFounderPercentage && { founderPercentage: parseOptionalNumber(founderPercentage) }),
            settings: {
                distributionMode: distribution === "" ? undefined : distribution,
                votingModel: voting === "" ? undefined : voting,
                reservationLimitPolicy: reservation === "" ? undefined : reservation,
                ...(reservation === "FIXED_DAYS_PER_MONTH" && {
                    reservationFixedDaysPerMonth: parseOptionalNumber(fixedDays),
                }),
                extraordinaryExpenseThreshold: parseOptionalNumber(threshold),
            },
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
            modalClassName="max-w-lg"
        >
            <FormSection
                id="create-group-config-title"
                title="Configuración del grupo"
                description="Datos y reglas del grupo. Algunas se pueden cambiar después por votación."
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

                <SelectField
                    id="group-distribution"
                    label="Reparto del bien"
                    hint="Elegí esto primero: condiciona las opciones siguientes."
                    placeholder="Elegí una opción"
                    options={DISTRIBUTION_OPTIONS}
                    value={distribution}
                    onChange={(event) => handleDistributionChange(event.target.value as DistributionMode)}
                    required
                />
                <SelectField
                    id="group-voting"
                    label="Aprobación de votaciones"
                    hint="Se cuenta sobre los miembros involucrados en el gasto."
                    placeholder="Elegí una opción"
                    options={votingOptions}
                    value={voting}
                    onChange={(event) => setVoting(event.target.value as VotingModel)}
                    disabled={settingsLocked}
                    required
                />
                <SelectField
                    id="group-reservation"
                    label="Restricción de reservas"
                    hint="Máximo de días por mes que un miembro puede reservar el bien."
                    placeholder="Elegí una opción"
                    options={reservationOptions}
                    value={reservation}
                    onChange={(event) => handleReservationChange(event.target.value as ReservationLimitPolicy)}
                    disabled={settingsLocked}
                    required
                />
                {reservation === "FIXED_DAYS_PER_MONTH" && (
                    <TextField
                        id="group-fixed-days"
                        label="Días por mes por miembro"
                        type="number"
                        inputMode="numeric"
                        min={MIN_FIXED_DAYS_PER_MONTH}
                        max={MAX_FIXED_DAYS_PER_MONTH}
                        step={1}
                        placeholder="Ej. 7"
                        value={fixedDays}
                        onChange={(event) => setFixedDays(event.target.value)}
                        required
                    />
                )}
                <TextField
                    id="group-extraordinary-threshold"
                    label="Monto a partir del cual un gasto es extraordinario"
                    type="number"
                    inputMode="decimal"
                    min={0.01}
                    step={0.01}
                    placeholder="Ej. 100000"
                    value={threshold}
                    onChange={(event) => setThreshold(event.target.value)}
                    disabled={settingsLocked}
                    required
                />
            </FormSection>

            <hr className="border-modal-border" />

            <FormSection
                id="create-group-profile-title"
                title="Tu perfil en el grupo"
                description="Cómo te van a ver los demás miembros y qué parte del bien te corresponde."
            >
                <TextField
                    id="founder-nickname"
                    name="founderNickname"
                    label="Tu apodo (opcional)"
                    placeholder="Ej. Juan"
                    autoComplete="off"
                    maxLength={30}
                />
                {requiresFounderPercentage && (
                    <TextField
                        id="founder-percentage"
                        label="Tu porcentaje de propiedad"
                        hint="El grupo queda detenido hasta que los porcentajes de todos los miembros sumen 100%."
                        type="number"
                        inputMode="decimal"
                        min={0.01}
                        max={100}
                        step={0.01}
                        placeholder="Ej. 50"
                        value={founderPercentage}
                        onChange={(event) => setFounderPercentage(event.target.value)}
                        required
                    />
                )}
            </FormSection>
        </ModalShell>
    );
};

export default CreateGroupModal;
