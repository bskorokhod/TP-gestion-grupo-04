import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {BASE_API_URL} from "@/config/app-query-client";
import {
    GroupPercentagesResponse,
    GroupPercentagesResponseSchema,
    UpdateGroupPercentagesRequest,
    UpdateGroupPercentagesRequestSchema,
} from "@/models/Percentage";
import {mockFetchGroupPercentages, mockUpdateGroupPercentages} from "@/services/mocks/percentagesMock";
import {useAccessTokenGetter, useHandleResponse} from "@/contexts/TokenContext.tsx";


export const USE_MOCK_PERCENTAGES = true;

function percentagesQueryKey(groupId: string) {
    return ["groups", groupId, "percentages"] as const;
}

export function useGroupPercentages(groupId: string) {
    const getAccessToken = useAccessTokenGetter();
    const handleResponse = useHandleResponse();

    return useQuery({
        queryKey: percentagesQueryKey(groupId),
        enabled: Boolean(groupId),
        queryFn: async (): Promise<GroupPercentagesResponse> => {
            if (USE_MOCK_PERCENTAGES) {
                return mockFetchGroupPercentages(groupId);
            }

            const accessToken = await getAccessToken();
            const response = await fetch(`${BASE_API_URL}/groups/${groupId}/members/percentages`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return handleResponse(response, (json) => GroupPercentagesResponseSchema.parse(json));
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

            if (USE_MOCK_PERCENTAGES) {
                return mockUpdateGroupPercentages(groupId, validatedReq);
            }

            const accessToken = await getAccessToken();
            const response = await fetch(`${BASE_API_URL}/groups/${groupId}/members/percentages`, {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(validatedReq),
            });

            return handleResponse(response, (json) => GroupPercentagesResponseSchema.parse(json));
        },
        onSuccess: (data) => {
            queryClient.setQueryData(percentagesQueryKey(groupId), data);
        },
    });
}
