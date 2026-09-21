import {z} from "zod";

export const GroupSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    createdAt: z.string(),
    memberCount: z.number(),
});

export type Group = z.infer<typeof GroupSchema>;
