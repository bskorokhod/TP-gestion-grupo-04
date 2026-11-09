import type { DistributionMode, GroupSettings, ReservationLimitPolicy, VotingModel } from "@/models/Group";
import {IconDefinition} from "@fortawesome/fontawesome-svg-core";

export type ConfigChangeKind = "voting" | "reservation" | "threshold" | "distribution" | "voteDeadline";

export type ConfigChangeRequest =
    | { kind: "voting"; votingModel: VotingModel }
    | {
    kind: "reservation";
    reservationLimitPolicy: ReservationLimitPolicy;
    reservationFixedDaysPerMonth?: number;
}
    | { kind: "threshold"; extraordinaryExpenseThreshold: number }
    | { kind: "distribution"; distributionMode: DistributionMode }
    | { kind: "voteDeadline"; voteDeadlineDays: number };

export interface ModalSettingItem {
    readonly kind: ConfigChangeKind;
    readonly icon: IconDefinition;
    readonly title: string;
    readonly description: string;
    readonly currentValue: (settings: GroupSettings) => string;
}