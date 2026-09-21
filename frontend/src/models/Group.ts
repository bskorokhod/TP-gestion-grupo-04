import {z} from "zod";

export const GroupSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    createdAt: z.string(),
    memberCount: z.number(),
    // Solo viene presente cuando el que pide el listado es fundador/admin del grupo.
    joinCode: z.string().nullable().optional(),
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
});

export type JoinGroup = z.infer<typeof JoinGroupSchema>;

export const GroupPreviewSchema = z.object({
    name: z.string(),
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

export const MembershipStatusSchema = z.enum([
    "REJECTED",
    "PENDING",
    "ACTIVE",
    "DEACTIVATED",
    "LEFT",
    "REMOVED",
]);

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
