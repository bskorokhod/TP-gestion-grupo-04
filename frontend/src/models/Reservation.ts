import { z } from "zod";

import { MemberColorSchema } from "@/models/Group.ts";

export const ReservationStatusSchema = z.enum(["ACTIVE", "CANCELLED"]);
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

export const CancellationRequestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type CancellationRequestStatus = z.infer<typeof CancellationRequestStatusSchema>;

export const ReservationSchema = z.object({
    id: z.number(),
    groupId: z.number(),
    memberId: z.number(),
    memberNickname: z.string(),
    memberColor: MemberColorSchema,
    startDate: z.string(),
    endDate: z.string(),
    status: ReservationStatusSchema,
    createdAt: z.string(),
});

export type Reservation = z.infer<typeof ReservationSchema>;

export const ReservationCreateSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
});
export type ReservationCreate = z.infer<typeof ReservationCreateSchema>;

export const CancellationRequestCreateSchema = z.object({
    reason: z.string().trim().min(1).max(500),
});

export const CancellationRequestSchema = z.object({
    id: z.number(),
    reservationId: z.number(),
    requesterId: z.number(),
    requesterNickname: z.string(),
    reason: z.string(),
    status: CancellationRequestStatusSchema,
    createdAt: z.string(),
});

export type CancellationRequest = z.infer<typeof CancellationRequestSchema>;
