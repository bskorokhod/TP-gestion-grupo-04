import { z } from "zod";

export const BrandSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type Brand = z.infer<typeof BrandSchema>;

export const BrandCreateRequestSchema = z.object({
  name: z.string().min(1, "Name must not be empty"),
});

export type BrandCreateRequest = z.infer<typeof BrandCreateRequestSchema>;
