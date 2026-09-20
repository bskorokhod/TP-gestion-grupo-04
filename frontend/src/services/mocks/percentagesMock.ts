import type {
    GroupPercentagesResponse,
    MemberPercentage,
    UpdateGroupPercentagesRequest,
} from "@/models/Percentage";
import {MEMBERS} from "@/models/User";


const MOCK_LATENCY_MS = 500;

function roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
}

function buildInitialMembers(): MemberPercentage[] {
    const share = roundToTwoDecimals(100 / MEMBERS.length);

    return MEMBERS.map((member, index) => {
        const isLast = index === MEMBERS.length - 1;
        const percentage = isLast
            ? roundToTwoDecimals(100 - share * (MEMBERS.length - 1))
            : share;

        return {
            memberId: member.id,
            initial: member.initial,
            name: member.name,
            fullName: member.fullName,
            percentage,
            locked: false,
        };
    });
}

const mockDatabase = new Map<string, MemberPercentage[]>();

function getOrCreateGroupMembers(groupId: string): MemberPercentage[] {
    const existing = mockDatabase.get(groupId);
    if (existing) {
        return existing;
    }

    const initial = buildInitialMembers();
    mockDatabase.set(groupId, initial);
    return initial;
}

function delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

export async function mockFetchGroupPercentages(groupId: string): Promise<GroupPercentagesResponse> {
    await delay();

    return {
        groupId,
        members: getOrCreateGroupMembers(groupId).map((member) => ({...member})),
    };
}

export async function mockUpdateGroupPercentages(
    groupId: string,
    req: UpdateGroupPercentagesRequest,
): Promise<GroupPercentagesResponse> {
    await delay();

    const previousMembers = getOrCreateGroupMembers(groupId);
    const updatedMembers: MemberPercentage[] = req.members.map((update) => {
        const previousMember = previousMembers.find((member) => member.memberId === update.memberId);

        return {
            memberId: update.memberId,
            initial: previousMember?.initial ?? "?",
            name: previousMember?.name ?? update.memberId,
            fullName: previousMember?.fullName ?? update.memberId,
            percentage: update.percentage,
            locked: update.locked,
        };
    });

    mockDatabase.set(groupId, updatedMembers);

    return {
        groupId,
        members: updatedMembers.map((member) => ({...member})),
    };
}
