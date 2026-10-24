import { z } from "zod";

/** Mismo límite que @Size(max = 30) en el backend (MemberNicknameUpdateDTO). */
export const MemberNicknameSchema = z
    .string()
    .trim()
    .min(1, "El apodo es obligatorio")
    .max(30, "El apodo no puede superar los 30 caracteres");

/** Body de PATCH /groups/{id}/members/me/nickname. */
export const UpdateMyNicknameRequestSchema = z.object({
    nickname: MemberNicknameSchema,
});
export type UpdateMyNicknameRequest = z.infer<typeof UpdateMyNicknameRequestSchema>;
