import type { DistributionMode, ReservationLimitPolicy, VotingModel } from "@/models/Group.ts";
import type { SplitMethod } from "@/models/Expense.ts";
import type { ConfigSetting } from "@/models/Vote.ts";
import type { ConfigChangeKind } from "@/models/Config.ts";

export const REQUIRES_PERCENTAGE_NOTE = " (requiere reparto porcentual)";

export const DISTRIBUTION_OPTIONS: ReadonlyArray<{ value: DistributionMode; label: string }> = [
    { value: "EQUAL", label: "Equitativo (partes iguales)" },
    { value: "PERCENTAGE", label: "Porcentual (según % de propiedad)" },
];

export const VOTING_OPTIONS: ReadonlyArray<{ value: VotingModel; label: string }> = [
    { value: "SIMPLE_MAJORITY", label: "Mayoría simple" },
    { value: "OWNERSHIP_WEIGHTED_MAJORITY", label: "Mayoría proporcional al % de propiedad" },
    { value: "UNANIMOUS", label: "Unánime" },
];

export const RESERVATION_OPTIONS: ReadonlyArray<{ value: ReservationLimitPolicy; label: string }> = [
    { value: "EQUAL", label: "Equitativo" },
    { value: "OWNERSHIP_PROPORTIONAL", label: "Proporcional al % de propiedad" },
    { value: "FIXED_DAYS_PER_MONTH", label: "Cantidad fija de días por mes" },
];

export const CURRENT_NOTE = " (vigente)";

export const BLOCKED_BY_OWNERSHIP_NOTE =
    " (hay opciones configuradas que dependen del % de propiedad)";

export const COPY: Record<ConfigChangeKind, { title: string; intro: string; label: string; hint?: string }> = {
    voting: {
        title: "Modo de aprobación de votación",
        intro: "La modificación se somete a votación unánime de los miembros del grupo.",
        label: "Nuevo modo de aprobación",
        hint: "Se cuenta sobre los miembros involucrados en el gasto.",
    },
    reservation: {
        title: "Restricción de reservas",
        intro: "La modificación se somete a votación unánime de los miembros del grupo.",
        label: "Nueva restricción de reservas",
        hint: "Máximo de días por mes que un miembro puede reservar el bien.",
    },
    threshold: {
        title: "Monto de gasto extraordinario",
        intro: "La modificación se somete a votación unánime de los miembros del grupo.",
        label: "Nuevo monto a partir del cual un gasto es extraordinario",
    },
    distribution: {
        title: "Modo de repartición del bien",
        intro: "La modificación se somete a votación unánime de los miembros del grupo.",
        label: "Nuevo modo de repartición",
    },
};

export const VOTING_MODEL_LABEL: Record<VotingModel, string> = {
    SIMPLE_MAJORITY: "Mayoría simple",
    OWNERSHIP_WEIGHTED_MAJORITY: "Mayoría ponderada por propiedad",
    UNANIMOUS: "Unanimidad",
};

export const SPLIT_METHOD_LABEL: Record<SplitMethod, string> = {
    EQUAL: "Partes iguales",
    PROPORTIONAL: "Según porcentaje de propiedad",
    CUSTOM: "Porcentajes personalizados",
};

export const CONFIG_SETTING_LABEL: Record<ConfigSetting, string> = {
    DISTRIBUTION_MODE: "Modo de repartición del bien",
    VOTING_MODEL: "Modo de aprobación de votación",
    RESERVATION_LIMIT_POLICY: "Restricción de reservas",
    EXTRAORDINARY_EXPENSE_THRESHOLD: "Monto de gasto extraordinario",
};

export const DISTRIBUTION_MODE_LABEL: Record<DistributionMode, string> = {
    EQUAL: "Equitativo (partes iguales)",
    PERCENTAGE: "Porcentual (según % de propiedad)",
};

export const RESERVATION_POLICY_LABEL: Record<ReservationLimitPolicy, string> = {
    EQUAL: "Equitativo",
    OWNERSHIP_PROPORTIONAL: "Proporcional al % de propiedad",
    FIXED_DAYS_PER_MONTH: "Cantidad fija de días por mes",
};