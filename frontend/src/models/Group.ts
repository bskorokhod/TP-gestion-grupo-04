import { z } from "zod";
import { MemberCvuSchema } from "@/models/Cvu.ts";

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

export const MIN_VOTE_DEADLINE_DAYS = 7;
export const MAX_VOTE_DEADLINE_DAYS = 30;

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
    voteDeadlineDays: z.number(),
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
        voteDeadlineDays: z
            .number({ error: "Indicá el plazo de cierre de las votaciones" })
            .int("El plazo debe ser un número entero de días")
            .min(MIN_VOTE_DEADLINE_DAYS, `El plazo debe estar entre ${MIN_VOTE_DEADLINE_DAYS} y ${MAX_VOTE_DEADLINE_DAYS} días`)
            .max(MAX_VOTE_DEADLINE_DAYS, `El plazo debe estar entre ${MIN_VOTE_DEADLINE_DAYS} y ${MAX_VOTE_DEADLINE_DAYS} días`),
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
    isPremium: z.boolean(),
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

// ---- Suscripción premium (pago simulado; espeja PremiumSubscribeDTO / PremiumSubscriptionDTO del backend) ----

function isExpiredCard(expiration: string, today: Date = new Date()): boolean {
    const [month, year] = expiration.split("/").map(Number);
    return 2000 + year < today.getFullYear() || (2000 + year === today.getFullYear() && month < today.getMonth() + 1);
}

export const PremiumSubscribeSchema = z.object({
    cardholderName: z
        .string()
        .trim()
        .min(1, "El nombre del titular es obligatorio")
        .max(100, "El nombre del titular no puede superar los 100 caracteres"),
    cardNumber: z
        .string()
        .trim()
        .refine(
            (value) => /^\d{13,19}$/.test(value.replace(/[ -]/g, "")) && /^[0-9 -]+$/.test(value),
            "El número de tarjeta debe tener entre 13 y 19 dígitos",
        ),
    expiration: z
        .string()
        .trim()
        .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "El vencimiento debe tener el formato MM/AA")
        .refine((value) => !isExpiredCard(value), "La tarjeta está vencida"),
    securityCode: z.string().trim().regex(/^\d{3,4}$/, "El código de seguridad debe tener 3 o 4 dígitos"),
});

export type PremiumSubscribe = z.infer<typeof PremiumSubscribeSchema>;

export const PremiumSubscriptionStatusSchema = z.enum(["ACTIVE", "CANCELLED"]);

export type PremiumSubscriptionStatus = z.infer<typeof PremiumSubscriptionStatusSchema>;

/**
 * Respuesta de suscribir y de cancelar. `trial` indica si la suscripción vigente arrancó con la prueba gratuita (una por
 * usuario y una por grupo). Una suscripción cancelada no trae `nextBillingAt` ni `trialEndsAt`, y una activa no trae
 * `cancelledAt`.
 */
export const PremiumSubscriptionSchema = z.object({
    groupId: z.number(),
    status: PremiumSubscriptionStatusSchema,
    trial: z.boolean(),
    trialEndsAt: z.string().nullish(),
    startedAt: z.string(),
    nextBillingAt: z.string().nullish(),
    cancelledAt: z.string().nullish(),
    /** Hasta cuándo el grupo conserva el premium tras cancelar (el momento de cancelar si era una prueba). */
    endsAt: z.string().nullish(),
    cardLast4: z.string(),
});

export type PremiumSubscription = z.infer<typeof PremiumSubscriptionSchema>;

/**
 * Si al usuario le corresponde la prueba gratuita al suscribir el grupo. Es orientativo: el backend lo vuelve a decidir
 * al suscribir, y la respuesta de `PremiumSubscription.trial` es la que manda.
 */
export const PremiumEligibilitySchema = z.object({
    trialAvailable: z.boolean(),
});

export type PremiumEligibility = z.infer<typeof PremiumEligibilitySchema>;

/**
 * En qué punto del plan premium está el grupo. NEVER: nunca tuvo premium ni prueba. TRIAL: en prueba gratuita. ACTIVE: premium
 * pago que se renueva. CANCELLED_IN_FORCE: cancelado pero vigente hasta el fin del período pagado. EXPIRED: tuvo premium
 * (o prueba) y ya no.
 */
export const PremiumStateSchema = z.enum(["NEVER", "TRIAL", "ACTIVE", "CANCELLED_IN_FORCE", "EXPIRED"]);

export type PremiumState = z.infer<typeof PremiumStateSchema>;

/** Estado del plan del grupo para cualquier miembro activo (espeja PremiumStatusDTO). Las fechas vienen solo si aplican. */
export const PremiumStatusSchema = z.object({
    state: PremiumStateSchema,
    premium: z.boolean(),
    /** Si al usuario le corresponde la prueba gratuita al suscribir (siempre false si el grupo ya es premium). */
    trialAvailable: z.boolean(),
    trialEndsAt: z.string().nullish(),
    trialDaysLeft: z.number().nullish(),
    nextBillingAt: z.string().nullish(),
    endsAt: z.string().nullish(),
    payerName: z.string().nullish(),
    /** Apodo del pagador en el grupo; lo ven todos los miembros. */
    payerNickname: z.string().nullish(),
    youArePayer: z.boolean(),
    /** Datos privados de la tarjeta: solo llegan al pagador y mientras el plan está activo. */
    cardLast4: z.string().nullish(),
    cardholderName: z.string().nullish(),
    /** Días completos hasta el próximo cobro o hasta que termine el premium cancelado (0 = menos de un día). */
    daysLeft: z.number().nullish(),
    monthlyPrice: z.number(),
    trialDays: z.number(),
});

export type PremiumStatus = z.infer<typeof PremiumStatusSchema>;

/** Oferta del plan premium, independiente de cualquier grupo o usuario (espeja PremiumPlanDTO). */
export const PremiumPlanSchema = z.object({
    monthlyPrice: z.number(),
    trialDays: z.number(),
});

export type PremiumPlan = z.infer<typeof PremiumPlanSchema>;

export const PremiumNoticeTypeSchema = z.enum([
    "TRIAL_STARTED",
    "PLAN_ACTIVATED",
    "PLAN_UPGRADED",
    "PLAN_REACTIVATED",
    "TRIAL_CANCELLED",
    "PLAN_CANCELLED",
    "TRIAL_ENDING",
    "TRIAL_CONVERTED",
    "PAYMENT_FAILED",
    "PLAN_ENDED",
]);

export type PremiumNoticeType = z.infer<typeof PremiumNoticeTypeSchema>;

/** Aviso sobre el plan premium que el usuario todavía no vio; se muestra como toast al entrar al grupo. */
export const PremiumNoticeSchema = z.object({
    id: z.number(),
    type: PremiumNoticeTypeSchema,
    actorName: z.string().nullish(),
    payerName: z.string().nullish(),
    youArePayer: z.boolean(),
    until: z.string().nullish(),
    occurredAt: z.string(),
});

export type PremiumNotice = z.infer<typeof PremiumNoticeSchema>;

/** Valores por defecto de las tres configuraciones exclusivas de premium (espeja GroupSettings del backend). */
export const DEFAULT_DISTRIBUTION_MODE: DistributionMode = "EQUAL";
export const DEFAULT_VOTING_MODEL: VotingModel = "SIMPLE_MAJORITY";
export const DEFAULT_RESERVATION_LIMIT_POLICY: ReservationLimitPolicy = "EQUAL";

/** Personalizar el reparto, las votaciones o las reservas es premium; cualquier otra combinación es la predeterminada. */
export function usesDefaultPremiumSettings(settings: {
    distributionMode: DistributionMode;
    votingModel: VotingModel;
    reservationLimitPolicy: ReservationLimitPolicy;
}): boolean {
    return settings.distributionMode === DEFAULT_DISTRIBUTION_MODE
        && settings.votingModel === DEFAULT_VOTING_MODEL
        && settings.reservationLimitPolicy === DEFAULT_RESERVATION_LIMIT_POLICY;
}

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
    /** Alias o CVU para recibir pagos: opcional; vacío = sin cargar. */
    cvu: MemberCvuSchema.optional(),
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
    cvu: z.string().nullish(),
    color: MemberColorSchema,
    status: MembershipStatusSchema,
    percentage: z.number().nullable(),
    requestedAt: z.string().nullable(),
    joinedAt: z.string().nullable(),
    photoUrl: z.string().nullable().optional(),
});

export type Member = z.infer<typeof MemberSchema>;