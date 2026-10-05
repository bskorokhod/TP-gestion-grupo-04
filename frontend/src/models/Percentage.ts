import {z} from "zod";
import {OwnershipPercentageSchema} from "@/models/Group.ts";

/** Body de PATCH /groups/{id}/members/me/percentage. */
export const UpdateMyPercentageRequestSchema = z.object({
    percentage: OwnershipPercentageSchema,
});
export type UpdateMyPercentageRequest = z.infer<typeof UpdateMyPercentageRequestSchema>;
