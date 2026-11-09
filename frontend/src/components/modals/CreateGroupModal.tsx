import {type FormEvent, type ReactNode, useState} from "react";
import {faStar} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import SelectField, {type SelectOption} from "@/components/Forms/SelectField.tsx";
import TextField from "@/components/Forms/TextField.tsx";
import {ModalShell} from "@/components/modals/ModalShell.tsx";
import {
    type DistributionMode,
    type GroupCreate,
    GroupCreateSchema,
    isReservationPolicyAllowed,
    isVotingModelAllowed,
    MAX_FIXED_DAYS_PER_MONTH,
    MIN_FIXED_DAYS_PER_MONTH,
    type ReservationLimitPolicy,
    type VotingModel,
    DEFAULT_DISTRIBUTION_MODE,
    DEFAULT_RESERVATION_LIMIT_POLICY,
    DEFAULT_VOTING_MODEL,
    usesDefaultPremiumSettings,
} from "@/models/Group.ts";
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
        <section aria-labelledby={id} className="flex flex-col gap-3">
            <div>
                <h3 id={id} className="text-sm font-bold uppercase tracking-wide text-modal-primary">
                    {title}
                </h3>
                <p className="mt-0.5 text-sm leading-tight text-modal-muted">{description}</p>
            </div>
            {children}
        </section>
    );
}

interface PremiumSettingProps {
    readonly children: ReactNode;
    readonly label: string;
}

function PremiumSetting({children, label}: PremiumSettingProps) {
    return (
        <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">{children}</div>
            <div
                aria-label={`Personalizar ${label} con Premium`}
                className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f7ead8] text-[#bd7413] transition hover:bg-[#f1ddc2]"
            >
                <FontAwesomeIcon icon={faStar} className="text-sm"/>
            </div>
        </div>
    );
}

export const CreateGroupModal = ({ onClose, onCreate }: CreateGroupModalProps) => {
    const { showSchemaError } = useFormToasts();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [distribution, setDistribution] = useState<DistributionMode | "">(DEFAULT_DISTRIBUTION_MODE);
    const [voting, setVoting] = useState<VotingModel | "">(DEFAULT_VOTING_MODEL);
    const [reservation, setReservation] = useState<ReservationLimitPolicy | "">(DEFAULT_RESERVATION_LIMIT_POLICY);
    const [fixedDays, setFixedDays] = useState("");
    const [threshold, setThreshold] = useState("100000");
    const [founderPercentage, setFounderPercentage] = useState("");

    const settingsLocked = distribution === "";
    const requiresFounderPercentage = distribution === "PERCENTAGE";
    const isPremiumConfiguration = distribution !== "" && voting !== "" && reservation !== ""
        && !usesDefaultPremiumSettings({
            distributionMode: distribution,
            votingModel: voting,
            reservationLimitPolicy: reservation,
        });

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
        const rawFounderCvu = formData.get("founderCvu")?.toString().trim() ?? "";

        const payload = {
            name: rawName,
            description: rawDescription,
            ...(rawFounderNickname && { founderNickname: rawFounderNickname }),
            ...(rawFounderCvu && { founderCvu: rawFounderCvu }),
            ...(requiresFounderPercentage && { founderPercentage: parseOptionalNumber(founderPercentage) }),
            settings: {
                distributionMode: distribution === "" ? undefined : distribution,
                votingModel: voting === "" ? undefined : voting,
                reservationLimitPolicy: reservation === "" ? undefined : reservation,
                ...(reservation === "FIXED_DAYS_PER_MONTH" && {
                    reservationFixedDaysPerMonth: parseOptionalNumber(fixedDays),
                }),
                extraordinaryExpenseThreshold: parseOptionalNumber(threshold),
                voteDeadlineDays: parseOptionalNumber(formData.get("voteDeadlineDays")?.toString() || ""),
            },
        };

        const result = GroupCreateSchema.safeParse(payload);
        if (!result.success) {
            showSchemaError(result.error.issues[0]?.message ?? "Revisá los datos");
            return;
        }

        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            await onCreate(result.data);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <ModalShell
            title="Crear grupo"
            submitLabel={isPremiumConfiguration ? "Crear grupo premium" : "Crear grupo"}
            onClose={onClose}
            onSubmit={handleSubmit}
            modalClassName="max-w-3xl p-4 sm:p-5 [&_input]:mt-1 [&_input]:h-9 [&_input]:rounded-lg [&_input]:px-3 [&_input]:text-xs [&_label]:text-xs [&_[aria-haspopup=listbox]]:mt-1 [&_[aria-haspopup=listbox]]:h-9 [&_[aria-haspopup=listbox]]:rounded-lg [&_[aria-haspopup=listbox]]:px-3 [&_button[type=submit]]:h-8 [&_button[type=submit]]:px-4 [&_button[type=submit]]:text-xs [&_footer_button[type=button]]:h-8 [&_footer_button[type=button]]:px-4 [&_footer]:mt-3"
            submitClassName={isPremiumConfiguration ? "border-[#bd7413] bg-[#bd7413] text-white hover:bg-[#a6650d]" : undefined}
            isSubmitting={isSubmitting}
        >
            <FormSection
                id="create-group-config-title"
                title="Configuración del grupo"
                description="Datos y reglas del grupo. Algunas se pueden cambiar después por votación."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex flex-col gap-3">
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
                            id="group-vote-deadline"
                            name="voteDeadlineDays"
                            type="number"
                            label="Plazo de votación (días)"
                            hint="Entre 7 y 30 días. Si no se aprueba en este plazo, se rechaza."
                            placeholder="Ej. 14"
                            disabled={settingsLocked}
                            required
                            min={7}
                            max={30}
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
                    </div>

                    {/* Columna Derecha */}
                    <div className="flex flex-col gap-3">
                        <PremiumSetting label="el reparto del bien">
                            <SelectField
                                id="group-distribution"
                                label="Reparto del bien"
                                hint="Modo de división del bien compartido"
                                placeholder="Elegí una opción"
                                options={DISTRIBUTION_OPTIONS}
                                value={distribution}
                                onChange={(value) => handleDistributionChange(value as DistributionMode)}
                                buttonClassName="h-9 rounded-lg border-[#e7cda9] bg-[#faf8f3] px-3 text-xs shadow-none"
                                required
                            />
                        </PremiumSetting>

                        <PremiumSetting label="la aprobación de votaciones">
                            <SelectField
                                id="group-voting"
                                label="Aprobación de votaciones"
                                hint="Método para alcanzar el quórum de las votaciones"
                                options={votingOptions}
                                placeholder="Elegí una opción"
                                value={voting}
                                onChange={(value) => setVoting(value as VotingModel)}
                                disabled={settingsLocked}
                                buttonClassName="h-9 rounded-lg border-[#e7cda9] bg-[#faf8f3] px-3 text-xs shadow-none"
                                required
                            />
                        </PremiumSetting>

                        <PremiumSetting label="la restricción de reservas">
                            <SelectField
                                id="group-reservation"
                                label="Restricción de reservas"
                                hint="Máximo de días por mes que un miembro puede reservar el bien"
                                options={reservationOptions}
                                placeholder="Elegí una opción"
                                value={reservation}
                                onChange={(value) => handleReservationChange(value as ReservationLimitPolicy)}
                                disabled={settingsLocked}
                                buttonClassName="h-9 rounded-lg border-[#e7cda9] bg-[#faf8f3] px-3 text-xs shadow-none"
                                required
                            />
                        </PremiumSetting>
                    </div>
                </div>
            </FormSection>

            <hr className="border-modal-border" />

            <FormSection
                id="create-group-profile-title"
                title="Tu perfil en el grupo"
                description="Cómo te van a ver los demás miembros y qué parte del bien te corresponde."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <TextField
                        id="founder-nickname"
                        name="founderNickname"
                        label="Tu apodo (opcional)"
                        placeholder="Ej. Juan"
                        autoComplete="off"
                        maxLength={30}
                    />
                    <TextField
                        id="founder-cvu"
                        name="founderCvu"
                        label="Tu alias o CVU (opcional)"
                        /*hint="Se lo mostramos a quienes tengan que pagarte. CVU de 22 dígitos o alias de 6 a 20 caracteres."*/
                        placeholder="Ej. juan.perez.mp"
                        autoComplete="off"
                        maxLength={22}
                    />
                    {requiresFounderPercentage && (
                        <div className="md:col-span-2">
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
                        </div>
                    )}
                </div>
            </FormSection>
        </ModalShell>
    );
};

export default CreateGroupModal;