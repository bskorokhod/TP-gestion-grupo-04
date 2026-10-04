import { z } from "zod";

export const GroupRoleSchema = z.enum(["FOUNDER", "ADMIN", "MEMBER"]);

export const MembershipStatusSchema = z.enum(["REJECTED", "PENDING", "ACTIVE", "DEACTIVATED", "LEFT", "REMOVED",]);

export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

/**
 * Estado de funcionamiento del grupo (lo deriva el backend de los miembros activos, no se persiste).
 * RUNNING: todo funciona. STOPPED: porcentual con los activos sumando distinto de 100%, o sin miembros activos.
 */
export const GroupStatusSchema = z.enum(["RUNNING", "STOPPED"]);
export type GroupStatus = z.infer<typeof GroupStatusSchema>;

/** Porcentaje de propiedad: mayor a 0, hasta 100 y con a lo sumo 2 decimales (espeja PercentageDistribution del backend). */
export const OwnershipPercentageSchema = z
    .number({ error: "El porcentaje debe ser un número" })
    .gt(0, "El porcentaje debe ser mayor a 0")
    .max(100, "El porcentaje no puede ser mayor a 100")
    .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
        "El porcentaje admite hasta 2 decimales",
    );

// ---- Configuración del grupo (se elige al crear el grupo; espeja GroupSettings del backend) ----

export const DistributionModeSchema = z.enum(["EQUAL", "PERCENTAGE"], {
    error: "Elegí cómo se reparte el bien",
});
export type DistributionMode = z.infer<typeof DistributionModeSchema>;

export const VotingModelSchema = z.enum(["SIMPLE_MAJORITY", "OWNERSHIP_WEIGHTED_MAJORITY", "UNANIMOUS"], {
    error: "Elegí el modelo de aprobación de votaciones",
});
export type VotingModel = z.infer<typeof VotingModelSchema>;

export const ReservationLimitPolicySchema = z.enum(["EQUAL", "OWNERSHIP_PROPORTIONAL", "FIXED_DAYS_PER_MONTH"], {
    error: "Elegí la restricción de reservas",
});
export type ReservationLimitPolicy = z.infer<typeof ReservationLimitPolicySchema>;

export const MIN_FIXED_DAYS_PER_MONTH = 1;
export const MAX_FIXED_DAYS_PER_MONTH = 31;

/** Las opciones que dependen del % de propiedad solo tienen sentido si el bien se reparte por porcentaje. */
export const VOTING_MODELS_REQUIRING_PERCENTAGE: readonly VotingModel[] = ["OWNERSHIP_WEIGHTED_MAJORITY"];
export const RESERVATION_POLICIES_REQUIRING_PERCENTAGE: readonly ReservationLimitPolicy[] = ["OWNERSHIP_PROPORTIONAL"];

export function isVotingModelAllowed(distribution: DistributionMode, voting: VotingModel): boolean {
    return distribution === "PERCENTAGE" || !VOTING_MODELS_REQUIRING_PERCENTAGE.includes(voting);
}

export function isReservationPolicyAllowed(
    distribution: DistributionMode,
    policy: ReservationLimitPolicy,
): boolean {
    return distribution === "PERCENTAGE" || !RESERVATION_POLICIES_REQUIRING_PERCENTAGE.includes(policy);
}

/** Forma que devuelve el backend (sin refinamientos: ya viene validada). */
export const GroupSettingsSchema = z.object({
    distributionMode: DistributionModeSchema,
    votingModel: VotingModelSchema,
    reservationLimitPolicy: ReservationLimitPolicySchema,
    reservationFixedDaysPerMonth: z.number().nullish(),
    extraordinaryExpenseThreshold: z.number(),
});

export type GroupSettings = z.infer<typeof GroupSettingsSchema>;

/** Forma que se envía al crear: replica las validaciones del backend. */
export const GroupSettingsCreateSchema = z
    .object({
        distributionMode: DistributionModeSchema,
        votingModel: VotingModelSchema,
        reservationLimitPolicy: ReservationLimitPolicySchema,
        reservationFixedDaysPerMonth: z
            .number({ error: "Indicá los días fijos por mes" })
            .int("Los días por mes deben ser un número entero")
            .min(MIN_FIXED_DAYS_PER_MONTH, `Los días por mes deben estar entre ${MIN_FIXED_DAYS_PER_MONTH} y ${MAX_FIXED_DAYS_PER_MONTH}`)
            .max(MAX_FIXED_DAYS_PER_MONTH, `Los días por mes deben estar entre ${MIN_FIXED_DAYS_PER_MONTH} y ${MAX_FIXED_DAYS_PER_MONTH}`)
            .optional(),
        extraordinaryExpenseThreshold: z
            .number({ error: "Indicá el monto a partir del cual un gasto es extraordinario" })
            .min(0.01, "El monto extraordinario debe ser mayor a 0")
            .max(9_999_999_999.99, "El monto extraordinario es demasiado grande")
            .refine(
                (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
                "El monto extraordinario admite hasta 2 decimales",
            ),
    })
    .superRefine((settings, ctx) => {
        if (!isVotingModelAllowed(settings.distributionMode, settings.votingModel)) {
            ctx.addIssue({
                code: "custom",
                path: ["votingModel"],
                message: "El modelo de votación elegido requiere reparto porcentual del bien",
            });
        }
        if (!isReservationPolicyAllowed(settings.distributionMode, settings.reservationLimitPolicy)) {
            ctx.addIssue({
                code: "custom",
                path: ["reservationLimitPolicy"],
                message: "La restricción de reservas elegida requiere reparto porcentual del bien",
            });
        }
        const fixed = settings.reservationLimitPolicy === "FIXED_DAYS_PER_MONTH";
        if (fixed && settings.reservationFixedDaysPerMonth === undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["reservationFixedDaysPerMonth"],
                message: "Indicá los días fijos por mes",
            });
        }
        if (!fixed && settings.reservationFixedDaysPerMonth !== undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["reservationFixedDaysPerMonth"],
                message: "Los días fijos por mes solo aplican a la restricción de cantidad fija",
            });
        }
    });

export type GroupSettingsCreate = z.infer<typeof GroupSettingsCreateSchema>;

export const GroupSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    createdAt: z.string(),
    memberCount: z.number(),
    joinCode: z.string(),
    myStatus: MembershipStatusSchema,
    settings: GroupSettingsSchema,
    status: GroupStatusSchema,
    /** Suma de los porcentajes de los miembros activos. */
    assignedPercentage: z.number(),
    /** Lo que falta para llegar a 100 (0 si el grupo está completo). */
    missingPercentage: z.number(),
});

export type Group = z.infer<typeof GroupSchema>;

// Formato exigido por el backend: 3 letras - 4 números - 3 letras (ej. ABC-1234-XYZ)
export const JOIN_CODE_REGEX = /^[A-Za-z]{3}-\d{4}-[A-Za-z]{3}$/;

export const GroupCreateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "El nombre del grupo es obligatorio")
        .max(30, "El nombre del grupo no puede superar los 30 caracteres"),
    description: z
        .string()
        .trim()
        .min(1, "La descripción es obligatoria")
        .max(500, "La descripción no puede superar los 500 caracteres"),
    founderNickname: z
        .string()
        .trim()
        .max(30, "El apodo no puede superar los 30 caracteres")
        .optional(),
    /** Porcentaje de propiedad del fundador: obligatorio en modo porcentual, se omite en equitativo. */
    founderPercentage: OwnershipPercentageSchema.optional(),
    settings: GroupSettingsCreateSchema,
}).superRefine((group, ctx) => {
    if (group.settings.distributionMode === "PERCENTAGE" && group.founderPercentage === undefined) {
        ctx.addIssue({
            code: "custom",
            path: ["founderPercentage"],
            message: "Indicá tu porcentaje de propiedad",
        });
    }
});

export type GroupCreate = z.infer<typeof GroupCreateSchema>;

export const JoinGroupSchema = z.object({
    joinCode: z
        .string()
        .trim()
        .toUpperCase()
        .regex(JOIN_CODE_REGEX, "El código debe tener el formato XXX-YYYY-XXX"),
    nickname: z
        .string()
        .trim()
        .min(1, "El apodo es obligatorio")
        .max(30, "El apodo no puede superar los 30 caracteres"),
    /** Porcentaje que se pide al unirse: obligatorio si el grupo es porcentual, se omite si es equitativo. */
    percentage: OwnershipPercentageSchema.optional(),
});

export type JoinGroup = z.infer<typeof JoinGroupSchema>;

export const GroupPreviewSchema = z.object({
    name: z.string(),
    distributionMode: DistributionModeSchema,
});

export type GroupPreview = z.infer<typeof GroupPreviewSchema>;

export const MemberColorSchema = z.enum([
    "RED",
    "BLUE",
    "GREEN",
    "YELLOW",
    "ORANGE",
    "PURPLE",
    "PINK",
    "LIGHT_BLUE",
]);

export type MemberColor = z.infer<typeof MemberColorSchema>;

export const JoinRequestSchema = z.object({
    memberId: z.number(),
    groupId: z.number(),
    groupName: z.string(),
    nickname: z.string(),
    color: MemberColorSchema,
    status: MembershipStatusSchema,
    requestedAt: z.string(),
});

export type JoinRequest = z.infer<typeof JoinRequestSchema>;


export const MemberSchema = z.object({
    id: z.number(),
    userId: z.number(),
    username: z.string(),
    nickname: z.string(),
    color: MemberColorSchema,
    status: MembershipStatusSchema,
    percentage: z.number().nullable(),
    requestedAt: z.string().nullable(),
    joinedAt: z.string().nullable(),
    photoUrl: z.string().nullable().optional(),
});

export type Member = z.infer<typeof MemberSchema>;