import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { BASE_API_URL } from "@/config/app-query-client";
import {
    GroupPercentagesResponse,
    UpdateGroupPercentagesRequest,
    UpdateGroupPercentagesRequestSchema,
} from "@/models/Percentage";
import { useAccessTokenGetter, useHandleResponse } from "@/contexts/TokenContext.tsx";

export const USE_MOCK_PERCENTAGES = false;

function percentagesQueryKey(groupId: string) {
    return ["groups", groupId, "percentages"] as const;
}

const ActiveMemberSchema = z.object({
    id: z.number(),
    username: z.string(),
    nickname: z.string(),
    percentage: z.number().nullable(),
});

type ActiveMember = z.infer<typeof ActiveMemberSchema>;

function toMemberPercentage(member: ActiveMember) {
    const initial = member.nickname.charAt(0).toUpperCase();
    return {
        memberId: String(member.id),
        initial,
        name: member.nickname,
        fullName: `@${member.username}`,
        percentage: member.percentage ?? 0,
        locked: false,
    };
}

export function useGroupPercentages(groupId: string) {
    const getAccessToken = useAccessTokenGetter();
    const handleResponse = useHandleResponse();

    return useQuery({
        queryKey: percentagesQueryKey(groupId),
        enabled: Boolean(groupId),
        queryFn: async (): Promise<GroupPercentagesResponse> => {
            const accessToken = await getAccessToken();
            const response = await fetch(
                `${BASE_API_URL}/groups/${groupId}/members?status=ACTIVE`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            return handleResponse(response, (json) => {
                const members = ActiveMemberSchema.array().parse(json);
                return {
                    groupId,
                    members: members.map(toMemberPercentage),
                };
            });
        },
    });
}

export function useUpdateGroupPercentages(groupId: string) {
    const getAccessToken = useAccessTokenGetter();
    const handleResponse = useHandleResponse();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (req: UpdateGroupPercentagesRequest): Promise<GroupPercentagesResponse> => {
            const validatedReq = UpdateGroupPercentagesRequestSchema.parse(req);

            // El backend espera { percentages: [{ memberId: Long, percentage: number }] }
            // El modelo frontend usa { members: [{ memberId: string, percentage, locked }] }
            const backendPayload = {
                percentages: validatedReq.members.map(({ memberId, percentage }) => ({
                    memberId: Number(memberId),
                    percentage,
                })),
            };

            const accessToken = await getAccessToken();
            const response = await fetch(
                `${BASE_API_URL}/groups/${groupId}/members/percentages`,
                {
                    method: "PUT",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(backendPayload),
                },
            );

            // El PUT devuelve MemberDTO[]; lo mapeamos al mismo shape que el GET
            return handleResponse(response, (json) => {
                const members = ActiveMemberSchema.array().parse(json);
                // Preservamos el estado locked del request para que la UI no lo pierda al guardar
                const lockedByMemberId = Object.fromEntries(
                    validatedReq.members.map((m) => [m.memberId, m.locked]),
                );
                return {
                    groupId,
                    members: members.map((member) => ({
                        ...toMemberPercentage(member),
                        locked: lockedByMemberId[String(member.id)] ?? false,
                    })),
                };
            });
        },
        onSuccess: (data) => {
            queryClient.setQueryData(percentagesQueryKey(groupId), data);
        },
    });
}
