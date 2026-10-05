import { z } from "zod";

import { ExpenseDetailsSchema, ExpenseMemberSchema } from "./Expense.ts";
import { DistributionModeSchema, ReservationLimitPolicySchema, VotingModelSchema } from "./Group.ts";
import type { DistributionMode, ReservationLimitPolicy, VotingModel } from "./Group.ts";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const VoteTypeSchema = z.enum(["EXTRAORDINARY_EXPENSE", "EXPENSE_REPORT", "CONFIG_CHANGE", "RESERVATION_CLAIM"]);
export type VoteType = z.infer<typeof VoteTypeSchema>;

export const VoteStatusSchema = z.enum(["ACTIVE", "FINALIZED"]);
export type VoteStatus = z.infer<typeof VoteStatusSchema>;

export const VoteOutcomeSchema = z.enum(["APPROVED", "REJECTED", "EXECUTION_FAILED"]);
export type VoteOutcome = z.infer<typeof VoteOutcomeSchema>;

export const VoteChoiceSchema = z.enum(["YES", "NO"]);
export type VoteChoice = z.infer<typeof VoteChoiceSchema>;

/** Qué configuración del grupo se propone cambiar en una votación CONFIG_CHANGE. */
export const ConfigSettingSchema = z.enum([
  "DISTRIBUTION_MODE",
  "VOTING_MODEL",
  "RESERVATION_LIMIT_POLICY",
  "EXTRAORDINARY_EXPENSE_THRESHOLD",
]);
export type ConfigSetting = z.infer<typeof ConfigSettingSchema>;

/** Cambio propuesto: `setting` más el nuevo valor de esa configuración (el resto viene null). */
export const ConfigChangeSchema = z.object({
  setting: ConfigSettingSchema,
  distributionMode: DistributionModeSchema.nullish(),
  votingModel: VotingModelSchema.nullish(),
  reservationLimitPolicy: ReservationLimitPolicySchema.nullish(),
  reservationFixedDaysPerMonth: z.number().nullish(),
  extraordinaryExpenseThreshold: z.number().nullish(),
});
export type ConfigChange = z.infer<typeof ConfigChangeSchema>;

/** Cuerpo para proponer un cambio: `setting` y solo el nuevo valor de esa configuración. */
export type ConfigChangeCreate =
  | { readonly setting: "DISTRIBUTION_MODE"; readonly distributionMode: DistributionMode }
  | { readonly setting: "VOTING_MODEL"; readonly votingModel: VotingModel }
  | {
      readonly setting: "RESERVATION_LIMIT_POLICY";
      readonly reservationLimitPolicy: ReservationLimitPolicy;
      readonly reservationFixedDaysPerMonth?: number; /** Solo con FIXED_DAYS_PER_MONTH. */
    }
  | { readonly setting: "EXTRAORDINARY_EXPENSE_THRESHOLD"; readonly extraordinaryExpenseThreshold: number };

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

export const ExpenseReportActionSchema = z.enum(["EDIT", "DELETE"]);
export type ExpenseReportAction = z.infer<typeof ExpenseReportActionSchema>;

/**
 * Lo que se vota en un reporte de gasto: los datos del gasto al proponer (`previous`) y, si se propone modificarlo,
 * los datos propuestos (`proposed`; null en una eliminación).
 */
export const ExpenseReportSchema = z.object({
  expenseId: z.number(),
  action: ExpenseReportActionSchema,
  previous: ProposedExpenseSchema,
  proposed: ProposedExpenseSchema.nullish(),
});
export type ExpenseReport = z.infer<typeof ExpenseReportSchema>;

/** Lo que se vota en un reclamo: la reserva reclamada, su dueño y el motivo del reclamo. */
export const ReservationClaimSchema = z.object({
  reservationId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  owner: ExpenseMemberSchema,
  reason: z.string(),
});
export type ReservationClaim = z.infer<typeof ReservationClaimSchema>;

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
  configChange: ConfigChangeSchema.nullish(), /** Solo en CONFIG_CHANGE. */
  reservationClaim: ReservationClaimSchema.nullish(), /** Solo en RESERVATION_CLAIM. */
  expenseReport: ExpenseReportSchema.nullish(), /** Solo en EXPENSE_REPORT. */
});
export type Vote = z.infer<typeof VoteSchema>;

export interface CastBallotInput {
  readonly voteId: number;
  readonly choice: VoteChoice;
}
