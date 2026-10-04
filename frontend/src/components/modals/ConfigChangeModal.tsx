import { type FormEvent, useState } from "react";

import SelectField, { type SelectOption } from "@/components/Forms/SelectField.tsx";
import TextField from "@/components/Forms/TextField.tsx";
import { ModalShell } from "@/components/modals/ModalShell.tsx";
import {useFormToasts} from "@/hooks/useFormToasts";
import {type DistributionMode, type GroupSettings, GroupSettingsCreateSchema, isReservationPolicyAllowed, isVotingModelAllowed, MAX_FIXED_DAYS_PER_MONTH, MIN_FIXED_DAYS_PER_MONTH, type ReservationLimitPolicy, type VotingModel,} from "@/models/Group.ts";
import type {ConfigChangeKind, ConfigChangeRequest} from "@/models/Config.ts";
import {BLOCKED_BY_OWNERSHIP_NOTE, COPY, CURRENT_NOTE, DISTRIBUTION_OPTIONS, REQUIRES_PERCENTAGE_NOTE, RESERVATION_OPTIONS, VOTING_OPTIONS,} from "@/constants/config_modals.ts";

export interface ConfigChangeModalProps {
    kind: ConfigChangeKind;
    settings: GroupSettings;
    onClose: () => void;
    onSubmit: (request: ConfigChangeRequest) => void | Promise<void>;
}

function parseOptionalNumber(raw: string): number | undefined {
    const trimmed = raw.trim();
    return trimmed === "" ? undefined : Number(trimmed);
}

function toOptions<T extends string>(list: ReadonlyArray<{ value: T; label: string }>, current: T, blockedNote: (value: T) => string | null,): SelectOption[] {
    return list.map(({ value, label }) => {
        if (value === current) {
            return { value, label: label + CURRENT_NOTE, disabled: true };
        }
        const note = blockedNote(value);
        return { value, label: note ? label + note : label, disabled: note !== null };
    });
}

function buildOptions(kind: ConfigChangeKind, settings: GroupSettings): SelectOption[] {
    switch (kind) {
        case "voting":
            return toOptions(VOTING_OPTIONS, settings.votingModel, (value) =>
                isVotingModelAllowed(settings.distributionMode, value) ? null : REQUIRES_PERCENTAGE_NOTE,
            );
        case "reservation":
            return toOptions(RESERVATION_OPTIONS, settings.reservationLimitPolicy, (value) =>
                isReservationPolicyAllowed(settings.distributionMode, value) ? null : REQUIRES_PERCENTAGE_NOTE,
            );
        case "distribution":
            return toOptions(DISTRIBUTION_OPTIONS, settings.distributionMode, (value) => {
                const compatible =
                    isVotingModelAllowed(value, settings.votingModel) &&
                    isReservationPolicyAllowed(value, settings.reservationLimitPolicy);
                return compatible ? null : BLOCKED_BY_OWNERSHIP_NOTE;
            });
        case "threshold":
            return [];
    }
}

export const ConfigChangeModal = ({ kind, settings, onClose, onSubmit }: ConfigChangeModalProps) => {
    const { showSchemaError } = useFormToasts();

    const [selected, setSelected] = useState("");
    const [fixedDays, setFixedDays] = useState("");
    const [threshold, setThreshold] = useState("");

    const copy = COPY[kind];
    const showFixedDays = kind === "reservation" && selected === "FIXED_DAYS_PER_MONTH";

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const candidate = {
            distributionMode: settings.distributionMode,
            votingModel: settings.votingModel,
            reservationLimitPolicy: settings.reservationLimitPolicy,
            reservationFixedDaysPerMonth: settings.reservationFixedDaysPerMonth ?? undefined,
            extraordinaryExpenseThreshold: settings.extraordinaryExpenseThreshold,
        };

        switch (kind) {
            case "voting":
                candidate.votingModel = selected as VotingModel;
                break;
            case "distribution":
                candidate.distributionMode = selected as DistributionMode;
                break;
            case "reservation":
                candidate.reservationLimitPolicy = selected as ReservationLimitPolicy;
                candidate.reservationFixedDaysPerMonth =
                    selected === "FIXED_DAYS_PER_MONTH" ? parseOptionalNumber(fixedDays) : undefined;
                break;
            case "threshold":
                candidate.extraordinaryExpenseThreshold = parseOptionalNumber(threshold) as number;
                break;
        }

        const result = GroupSettingsCreateSchema.safeParse(candidate);
        if (!result.success) {
            showSchemaError(result.error.issues[0]?.message ?? "Revisá los datos");
            return;
        }

        const valid = result.data;
        switch (kind) {
            case "voting":
                await onSubmit({ kind, votingModel: valid.votingModel });
                break;
            case "distribution":
                await onSubmit({ kind, distributionMode: valid.distributionMode });
                break;
            case "reservation":
                await onSubmit({
                    kind,
                    reservationLimitPolicy: valid.reservationLimitPolicy,
                    reservationFixedDaysPerMonth: valid.reservationFixedDaysPerMonth,
                });
                break;
            case "threshold":
                if (valid.extraordinaryExpenseThreshold === settings.extraordinaryExpenseThreshold) {
                    showSchemaError("El monto ingresado ya es el vigente");
                    return;
                }
                await onSubmit({ kind, extraordinaryExpenseThreshold: valid.extraordinaryExpenseThreshold });
                break;
        }
    }

    return (
        <ModalShell
            title={copy.title}
            submitLabel="Solicitar modificación"
            onClose={onClose}
            onSubmit={handleSubmit}
            modalClassName="max-w-lg"
        >
            <p className="text-base text-modal-muted">{copy.intro}</p>

            {kind === "threshold" ? (
                <TextField
                    id="config-change-threshold"
                    label={copy.label}
                    hint={`Valor vigente: $ ${settings.extraordinaryExpenseThreshold.toLocaleString("es-AR")}`}
                    type="number"
                    inputMode="decimal"
                    min={0.01}
                    step={0.01}
                    placeholder="Ej. 100000"
                    value={threshold}
                    onChange={(event) => setThreshold(event.target.value)}
                    required
                />
            ) : (
                <SelectField
                    id="config-change-select"
                    label={copy.label}
                    hint={copy.hint}
                    placeholder="Elegí una opción"
                    options={buildOptions(kind, settings)}
                    value={selected}
                    onChange={(event) => setSelected(event.target.value)}
                    required
                />
            )}

            {showFixedDays && (
                <TextField
                    id="config-change-fixed-days"
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
        </ModalShell>
    );
};

export default ConfigChangeModal;