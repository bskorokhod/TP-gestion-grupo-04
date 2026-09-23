import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
    GroupPercentagesResponse,
    MemberPercentage,
    UpdateGroupPercentagesRequest,
    UpdateGroupPercentagesRequestSchema,
} from "@/models/Percentage";
import { useApiClient } from "@/hooks/useApiClient";
import {MemberColorSchema} from "@/models/Group.ts";

function percentagesQueryKey(groupId: string) {
    return ["groups", groupId, "percentages"] as const;
}

const ActiveMemberSchema = z.object({
    id: z.number(),
    username: z.string(),
    nickname: z.string(),
    percentage: z.number().nullable(),
    color: MemberColorSchema.optional(),
    photoUrl: z.string().nullable().optional(),
});
type ActiveMember = z.infer<typeof ActiveMemberSchema>;

function toMemberPercentage(member: ActiveMember): MemberPercentage {
    const initial = member.nickname.charAt(0).toUpperCase();
    return {
        memberId: String(member.id),
        initial,
        name: member.nickname,
        fullName: member.username,
        color: member.color,
        photoUrl: member.photoUrl,
        percentage: member.percentage ?? 0,
        locked: false,
    };
}

export function useGroupPercentages(groupId: string) {
    const api = useApiClient();

    return useQuery({
        queryKey: percentagesQueryKey(groupId),
        enabled: Boolean(groupId),
        queryFn: async (): Promise<GroupPercentagesResponse> => {
            const data = await api.get(`/groups/${groupId}/members?status=ACTIVE`);
            const members = ActiveMemberSchema.array().parse(data);
            return { groupId, members: members.map(toMemberPercentage) };
        },
    });
}

export function useUpdateGroupPercentages(groupId: string) {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation<GroupPercentagesResponse, Error, UpdateGroupPercentagesRequest>({
        mutationFn: async (req): Promise<GroupPercentagesResponse> => {
            const validated = UpdateGroupPercentagesRequestSchema.parse(req);

            const backendPayload = {
                percentages: validated.members.map(({ memberId, percentage }) => ({
                    memberId: Number(memberId),
                    percentage,
                })),
            };

            const data = await api.put(
                `/groups/${groupId}/members/percentages`,
                backendPayload,
            );

            const members = ActiveMemberSchema.array().parse(data);
            const lockedByMemberId: Record<string, boolean> = Object.fromEntries(
                validated.members.map((m) => [m.memberId, m.locked]),
            );

            return {
                groupId,
                members: members.map((member) => ({
                    ...toMemberPercentage(member),
                    locked: lockedByMemberId[String(member.id)] ?? false,
                })),
            };
        },
        onSuccess: (data): void => {
            queryClient.setQueryData(percentagesQueryKey(groupId), data);
        },
    });
}