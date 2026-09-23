import {z} from "zod";
import {MemberColorSchema} from "@/models/Group.ts";


export const MemberPercentageSchema = z.object({
    memberId: z.string().min(1),
    initial: z.string().min(1),
    name: z.string().min(1),
    fullName: z.string().min(1),
    color: MemberColorSchema.optional(),
    photoUrl: z.string().nullable().optional(),
    percentage: z
        .number()
        .min(0, "El porcentaje no puede ser menor a 0")
        .max(100, "El porcentaje no puede ser mayor a 100"),
    locked: z.boolean(),
});
export type MemberPercentage = z.infer<typeof MemberPercentageSchema>;


export const GroupPercentagesResponseSchema = z.object({
    groupId: z.string().min(1),
    members: z.array(MemberPercentageSchema),
});
export type GroupPercentagesResponse = z.infer<typeof GroupPercentagesResponseSchema>;


export const PercentageValueSchema = z
    .number({error: "El porcentaje debe ser un número"})
    .min(0, "El porcentaje no puede ser menor a 0")
    .max(100, "El porcentaje no puede ser mayor a 100");

const UpdateMemberPercentageSchema = z.object({
    memberId: z.string().min(1),
    percentage: PercentageValueSchema,
    locked: z.boolean(),
});
export type UpdateMemberPercentage = z.infer<typeof UpdateMemberPercentageSchema>;


export const UpdateGroupPercentagesRequestSchema = z
    .object({
        members: z.array(UpdateMemberPercentageSchema).min(1, "El grupo debe tener al menos un miembro"),
    })
    .refine(
        (data) => roundToTwoDecimals(sumPercentageValues(data.members)) === 100,
        {
            error: "La suma de los porcentajes de los miembros activos debe ser exactamente 100",
            path: ["members"],
        },
    );
export type UpdateGroupPercentagesRequest = z.infer<typeof UpdateGroupPercentagesRequestSchema>;

function sumPercentageValues(members: ReadonlyArray<{ percentage: number }>): number {
    return members.reduce((total, member) => total + member.percentage, 0);
}

function roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
}
