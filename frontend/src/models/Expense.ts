import { z } from "zod";

import { MemberColorSchema } from "./Group.ts";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const ExpenseStatusSchema = z.enum([
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
]);
export type ExpenseStatus = z.infer<typeof ExpenseStatusSchema>;

export const SplitMethodSchema = z.enum(["EQUAL", "PROPORTIONAL", "CUSTOM"]);
export type SplitMethod = z.infer<typeof SplitMethodSchema>;

export const ReviewOutcomeSchema = z.enum(["APPROVED", "REJECTED"]);
export type ReviewOutcome = z.infer<typeof ReviewOutcomeSchema>;

export const DebtStatusSchema = z.enum(["ACTIVE", "SUSPENDED"]);
export type DebtStatus = z.infer<typeof DebtStatusSchema>;

export const BalanceItemTypeSchema = z.enum(["CREDIT", "DEBT"]);
export type BalanceItemType = z.infer<typeof BalanceItemTypeSchema>;

// ─── Member ─────────────────────────────────────────────────────────────────

export const ExpenseMemberSchema = z.object({
  id: z.number(),
  nickname: z.string(),
  color: MemberColorSchema,
  photoUrl: z.string().nullable().optional(),
});
export type ExpenseMember = z.infer<typeof ExpenseMemberSchema>;

// ─── Details / Participants / Debts ─────────────────────────────────────────

export const ExpenseParticipantSchema = z.object({
  member: ExpenseMemberSchema,
  customPercentage: z.number().nullable().optional(),
});
export type ExpenseParticipant = z.infer<typeof ExpenseParticipantSchema>;

export const ExpenseDetailsSchema = z.object({
  title: z.string(),
  description: z.string(),
  totalAmount: z.number(),
  splitMethod: SplitMethodSchema,
  creditor: ExpenseMemberSchema,
  receiptUrl: z.string().nullable().optional(),
  participants: z.array(ExpenseParticipantSchema),
});
export type ExpenseDetails = z.infer<typeof ExpenseDetailsSchema>;

export const ResolutionSchema = z.object({
  resolvedBy: ExpenseMemberSchema,
  outcome: ReviewOutcomeSchema,
  resolvedAt: z.string(),
});
export type Resolution = z.infer<typeof ResolutionSchema>;

export const DebtSchema = z.object({
  id: z.number(),
  debtor: ExpenseMemberSchema,
  creditor: ExpenseMemberSchema,
  amount: z.number(),
  paidAmount: z.number(),
  status: DebtStatusSchema,
});
export type Debt = z.infer<typeof DebtSchema>;

// ─── Expense ────────────────────────────────────────────────────────────────

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

// ─── Payload de creación/edición ────────────────────────────────────────────

export const ExpenseDataSchema = z.object({
  title: z.string().trim().min(1).max(200),         // ← nuevo, obligatorio
  description: z.string().trim().min(1).max(200),   // ← sigue obligatorio
  totalAmount: z.number().min(0.01),
  creditorId: z.number(),
  splitMethod: SplitMethodSchema,
  participants: z
      .array(
          z.object({
            memberId: z.number(),
            percentage: z.number().min(0).max(100).nullable().optional(),
          }),
      )
      .nonempty(),
  receiptUrl: z.string().url().max(2048),
});
export type ExpenseData = z.infer<typeof ExpenseDataSchema>;

// ─── Derivados ──────────────────────────────────────────────────────────────

export const GroupSummarySchema = z.object({
  me: ExpenseMemberSchema,
  owes: z.number(),
  owed: z.number(),
  pendingExpenses: z.number(),
});
export type GroupSummary = z.infer<typeof GroupSummarySchema>;

export const BalanceItemSchema = z.object({
  expenseId: z.number(),
  debtId: z.number(),
  description: z.string(),
  amount: z.number(),
  type: BalanceItemTypeSchema,
});
export type BalanceItem = z.infer<typeof BalanceItemSchema>;

export const BalanceByPersonSchema = z.object({
  member: ExpenseMemberSchema,
  netBalance: z.number(),
  items: z.array(BalanceItemSchema),
});
export type BalanceByPerson = z.infer<typeof BalanceByPersonSchema>;