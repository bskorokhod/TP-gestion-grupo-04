import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessTokenGetter } from "@/contexts/TokenContext.tsx";
import {
    Group,
    GroupCreate,
    GroupCreateSchema,
    GroupPreview,
    GroupPreviewSchema,
    GroupSchema,
    JoinGroup,
    JoinGroupSchema,
    JOIN_CODE_REGEX,
    JoinRequest,
    JoinRequestSchema,
} from "@/models/Group.ts";
import { ApiService } from "@/services/ApiServices.ts";


export function useGetGroups() {
    const getAccessToken = useAccessTokenGetter();

    return useQuery({
        queryKey: ["groups"],
        queryFn: async (): Promise<Group[]> => {
            const data = await ApiService.authenticatedRequest(
                getAccessToken,
                "/groups",
                { method: "GET" }
            );
            return GroupSchema.array().parse(data);
        },
    });
}

export function useGetGroup(groupId: number) {
    const getAccessToken = useAccessTokenGetter();

    return useQuery({
        queryKey: ["groups", groupId],
        enabled: Number.isFinite(groupId),
        queryFn: async (): Promise<Group> => {
            const data = await ApiService.authenticatedRequest(
                getAccessToken,
                `/groups/${groupId}`,
                { method: "GET" }
            );
            return GroupSchema.parse(data);
        },
    });
}

export function usePreviewGroup(joinCode: string) {
    const normalized = joinCode.trim().toUpperCase();
    const enabled = JOIN_CODE_REGEX.test(normalized);

    return useQuery({
        queryKey: ["group-preview", normalized],
        enabled,
        retry: false,
        staleTime: 30_000,
        queryFn: async (): Promise<GroupPreview> => {
            const data = await ApiService.get(
                `/groups/join/${encodeURIComponent(normalized)}`
            );
            return GroupPreviewSchema.parse(data);
        },
    });
}

export function useGetMyJoinRequests() {
    const getAccessToken = useAccessTokenGetter();

    return useQuery({
        queryKey: ["join-requests", "mine"],
        queryFn: async (): Promise<JoinRequest[]> => {
            const data = await ApiService.authenticatedRequest(
                getAccessToken,
                "/groups/join-requests/mine",
                { method: "GET" }
            );
            return JoinRequestSchema.array().parse(data);
        },
    });
}

export function useCreateGroup() {
    const getAccessToken = useAccessTokenGetter();
    const queryClient = useQueryClient();

    return useMutation<Group, Error, GroupCreate>({
        mutationFn: async (payload: GroupCreate): Promise<Group> => {
            const validated = GroupCreateSchema.parse(payload);
            const response = await ApiService.authenticatedRequest(
                getAccessToken,
                "/groups",
                {
                    method: "POST",
                    body: JSON.stringify(validated),
                }
            );
            return GroupSchema.parse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
        },
    });
}

export function useJoinGroup() {
    const getAccessToken = useAccessTokenGetter();
    const queryClient = useQueryClient();

    return useMutation<JoinRequest, Error, JoinGroup>({
        mutationFn: async (payload: JoinGroup): Promise<JoinRequest> => {
            const validated = JoinGroupSchema.parse(payload);
            const response = await ApiService.authenticatedRequest(
                getAccessToken,
                "/groups/join",
                {
                    method: "POST",
                    body: JSON.stringify(validated),
                }
            );
            return JoinRequestSchema.parse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            queryClient.invalidateQueries({ queryKey: ["join-requests", "mine"] });
        },
    });
}