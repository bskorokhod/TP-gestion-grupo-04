import type {MemberPercentage} from "@/models/Percentage";

export const TOTAL_PERCENTAGE = 100;

function roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
}

export function sumPercentages(members: ReadonlyArray<MemberPercentage>): number {
    return roundToTwoDecimals(members.reduce((total, member) => total + member.percentage, 0));
}

export function sumLockedPercentages(members: ReadonlyArray<MemberPercentage>): number {
    return sumPercentages(members.filter((member) => member.locked));
}

export function getPercentageDifference(members: ReadonlyArray<MemberPercentage>): number {
    return roundToTwoDecimals(TOTAL_PERCENTAGE - sumPercentages(members));
}

export function isTotalComplete(members: ReadonlyArray<MemberPercentage>): boolean {
    return getPercentageDifference(members) === 0;
}

export function canLockMemberPercentage(
    members: ReadonlyArray<MemberPercentage>,
    memberId: string,
    targetPercentage: number,
): boolean {
    const otherLockedSum = sumLockedPercentages(
        members.filter((member) => member.memberId !== memberId),
    );
    return roundToTwoDecimals(otherLockedSum + targetPercentage) <= TOTAL_PERCENTAGE;
}

export function getMaxLockablePercentage(
    members: ReadonlyArray<MemberPercentage>,
    memberId: string,
): number {
    const otherLockedSum = sumLockedPercentages(
        members.filter((member) => member.memberId !== memberId),
    );
    return Math.max(0, roundToTwoDecimals(TOTAL_PERCENTAGE - otherLockedSum));
}

export function autoBalancePercentages(
    members: ReadonlyArray<MemberPercentage>,
): MemberPercentage[] {
    const unlockedIds = members.filter((member) => !member.locked).map((member) => member.memberId);

    if (unlockedIds.length === 0) {
        return members.map((member) => ({...member}));
    }

    const lockedSum = sumLockedPercentages(members);
    const remaining = Math.max(0, roundToTwoDecimals(TOTAL_PERCENTAGE - lockedSum));
    const share = roundToTwoDecimals(remaining / unlockedIds.length);
    const lastUnlockedId = unlockedIds[unlockedIds.length - 1];

    let assignedSoFar = 0;
    return members.map((member) => {
        if (member.locked) {
            return {...member};
        }

        if (member.memberId === lastUnlockedId) {
            return {...member, percentage: roundToTwoDecimals(remaining - assignedSoFar)};
        }

        assignedSoFar = roundToTwoDecimals(assignedSoFar + share);
        return {...member, percentage: share};
    });
}
