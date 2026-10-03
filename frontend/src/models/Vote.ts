import { z } from "zod";

import { ExpenseDetailsSchema, ExpenseMemberSchema } from "./Expense.ts";
import { VotingModelSchema } from "./Group.ts";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const VoteTypeSchema = z.enum(["EXTRAORDINARY_EXPENSE", "EXPENSE_REPORT", "CONFIG_CHANGE"]);
export type VoteType = z.infer<typeof VoteTypeSchema>;

export const VoteStatusSchema = z.enum(["ACTIVE", "FINALIZED"]);
export type VoteStatus = z.infer<typeof VoteStatusSchema>;

export const VoteOutcomeSchema = z.enum(["APPROVED", "REJECTED", "EXECUTION_FAILED"]);
export type VoteOutcome = z.infer<typeof VoteOutcomeSchema>;

export const VoteChoiceSchema = z.enum(["YES", "NO"]);
export type VoteChoice = z.infer<typeof VoteChoiceSchema>;

// ─── Vote ───────────────────────────────────────────────────────────────────

/** Votos por opción. Los pesos son 1 por miembro, salvo en la mayoría ponderada (% de propiedad). */
export const VoteProgressSchema = z.object({
  yes: z.number(),
  no: z.number(),
  pending: z.number(),
  yesWeight: z.number(),
  noWeight: z.number(),
  pendingWeight: z.number(),
});
export type VoteProgress = z.infer<typeof VoteProgressSchema>;

/** Igual que ExpenseDetails, pero la descripción es opcional: el backend la devuelve null si quedó vacía. */
const ProposedExpenseSchema = ExpenseDetailsSchema.extend({
  description: z.string().nullish(),
});
export type ProposedExpense = z.infer<typeof ProposedExpenseSchema>;

export const VoteSchema = z.object({
  id: z.number(),
  groupId: z.number(),
  type: VoteTypeSchema,
  votingModel: VotingModelSchema,
  status: VoteStatusSchema,
  outcome: VoteOutcomeSchema.nullish(),
  failureReason: z.string().nullish(),
  proposer: ExpenseMemberSchema,
  createdAt: z.string(),
  involved: z.array(ExpenseMemberSchema),
  progress: VoteProgressSchema,
  myChoice: VoteChoiceSchema.nullish(),
  canVote: z.boolean(),
  /** Solo en EXTRAORDINARY_EXPENSE. */
  expenseProposal: ProposedExpenseSchema.nullish(),
});
export type Vote = z.infer<typeof VoteSchema>;

export interface CastBallotInput {
  readonly voteId: number;
  readonly choice: VoteChoice;
}
