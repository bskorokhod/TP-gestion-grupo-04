import { z } from "zod";
import { MemberColorSchema } from "./Group.ts";

export const ExpenseStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type ExpenseStatus = z.infer<typeof ExpenseStatusSchema>;

export const SplitMethodSchema = z.enum(["EQUAL", "PROPORTIONAL", "CUSTOM"]);
export type SplitMethod = z.infer<typeof SplitMethodSchema>;

export const ReviewOutcomeSchema = z.enum(["APPROVED", "REJECTED"]);

export const ExpenseMemberSchema = z.object({
  id: z.number(),
  nickname: z.string(),
  color: MemberColorSchema,
});
export type ExpenseMember = z.infer<typeof ExpenseMemberSchema>;

export const ExpenseParticipantSchema = z.object({
  member: ExpenseMemberSchema,
  customPercentage: z.number().nullable().optional(),
});

export const ExpenseDetailsSchema = z.object({
  description: z.string(),
  totalAmount: z.number(),
  splitMethod: SplitMethodSchema,
  creditor: ExpenseMemberSchema,
  receiptUrl: z.string().nullable().optional(),
  participants: z.array(ExpenseParticipantSchema),
});

export const ResolutionSchema = z.object({
  resolvedBy: ExpenseMemberSchema,
  outcome: ReviewOutcomeSchema,
  resolvedAt: z.string(),
});

export const DebtStatusSchema = z.enum(["PENDING", "PARTIAL", "PAID"]);

export const DebtSchema = z.object({
  id: z.number(),
  debtor: ExpenseMemberSchema,
  creditor: ExpenseMemberSchema,
  amount: z.number(),
  paidAmount: z.number(),
  status: DebtStatusSchema,
});
export type Debt = z.infer<typeof DebtSchema>;

export const ExpenseSchema = z.object({
  id: z.number(),
  groupId: z.number(),
  creator: ExpenseMemberSchema,
  status: ExpenseStatusSchema,
  details: ExpenseDetailsSchema,
  pendingDetails: ExpenseDetailsSchema.nullable().optional(),
  lastResolution: ResolutionSchema.nullable().optional(),
  debts: z.array(DebtSchema),
  createdAt: z.string(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const ExpenseDataSchema = z.object({
  description: z.string().max(200),
  totalAmount: z.number().min(0.01),
  creditorId: z.number(),
  splitMethod: SplitMethodSchema,
  participants: z.array(z.object({
    memberId: z.number(),
    percentage: z.number().min(0).max(100).nullable().optional()
  })).nonempty(),
  receiptUrl: z.string().max(2048)
});
export type ExpenseData = z.infer<typeof ExpenseDataSchema>;