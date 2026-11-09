import { z } from "zod";

/** Espeja GroupMember.CVU_REGEX del backend: CVU de 22 dígitos o alias de 6 a 20 caracteres; vacío = sin cargar. */
export const CVU_REGEX = /^(\d{22}|[A-Za-z0-9.-]{6,20})?$/;

export const MemberCvuSchema = z
    .string()
    .trim()
    .regex(CVU_REGEX, "Ingresá un CVU de 22 dígitos o un alias de 6 a 20 caracteres (letras, números, . y -)");


/** Body de PATCH /groups/{id}/members/me/cvu. Un valor vacío borra el alias/CVU. */
export const UpdateMyCvuRequestSchema = z.object({
    cvu: MemberCvuSchema,
});

export type UpdateMyCvuRequest = z.infer<typeof UpdateMyCvuRequestSchema>;
