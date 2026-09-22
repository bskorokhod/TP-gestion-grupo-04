import { useMemo } from "react";
import {
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";
import { useToken } from "@/contexts/TokenContext.tsx";
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
    Member,
    MemberSchema,
    MembershipStatus,
} from "@/models/Group.ts";
import { getApiErrorStatus } from "@/lib/api.ts";
import { ApiService } from "@/services/ApiServices";
import { TokenService } from "@/services/TokenService";

const MAX_RETRIES = 3;


function retryUnlessClientError(failureCount: number, error: unknown): boolean {
    const status = getApiErrorStatus(error);
    if (status !== null && status >= 400 && status < 500) return false;
    return failureCount < MAX_RETRIES;
}


export function useGetGroups() {
    const api = useApiClient();
    return useQuery({
        queryKey: ["groups"] as const,
        queryFn: async (): Promise<Group[]> => {
            const data = await api.get("/groups");
            return GroupSchema.array().parse(data);
        },
    });
}

export function useGetGroup(groupId: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: ["groups", groupId] as const,
        enabled: Number.isFinite(groupId) && groupId > 0,
        retry: retryUnlessClientError,
        queryFn: async (): Promise<Group> => {
            const data = await api.get(`/groups/${groupId}`);
            return GroupSchema.parse(data);
        },
    });
}

export function useGetGroupByCode(groupCode: string) {
    const api = useApiClient();
    const normalized = groupCode.trim().toUpperCase();

    return useQuery({
        queryKey: ["groups", "code", normalized] as const,
        enabled: JOIN_CODE_REGEX.test(normalized),
        retry: retryUnlessClientError,
        queryFn: async (): Promise<Group> => {
            const data = await api.get(`/groups/code/${encodeURIComponent(normalized)}`);
            return GroupSchema.parse(data);
        },
    });
}

export function usePreviewGroup(joinCode: string) {
    const normalized = joinCode.trim().toUpperCase();
    const enabled = JOIN_CODE_REGEX.test(normalized);

    return useQuery({
        queryKey: ["group-preview", normalized] as const,
        enabled,
        retry: false,
        staleTime: 30_000,
        queryFn: async (): Promise<GroupPreview> => {
            // Endpoint público: no requiere token.
            const data = await ApiService.get(`/groups/join/${encodeURIComponent(normalized)}`);
            return GroupPreviewSchema.parse(data);
        },
    });
}

export function useGetMyJoinRequests() {
    const api = useApiClient();
    return useQuery({
        queryKey: ["join-requests", "mine"] as const,
        queryFn: async (): Promise<JoinRequest[]> => {
            const data = await api.get("/groups/join-requests/mine");
            return JoinRequestSchema.array().parse(data);
        },
    });
}

export function useGetGroupMembers(groupId: number | undefined, status?: MembershipStatus) {
    const api = useApiClient();
    const suffix = status ? `?status=${status}` : "";

    return useQuery({
        queryKey: ["groups", groupId, "members", status ?? "ALL"] as const,
        enabled: typeof groupId === "number" && Number.isFinite(groupId) && groupId > 0,
        queryFn: async (): Promise<Member[]> => {
            if (typeof groupId !== "number") return [];
            const data = await api.get(`/groups/${groupId}/members${suffix}`);
            return MemberSchema.array().parse(data);
        },
    });
}

export function useGetPendingMembers(groupId: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: ["groups", groupId, "members", "PENDING"] as const,
        enabled: Number.isFinite(groupId) && groupId > 0,
        queryFn: async (): Promise<Member[]> => {
            const data = await api.get(`/groups/${groupId}/members?status=PENDING`);
            return MemberSchema.array().parse(data);
        },
    });
}


export interface PendingApproval {
    readonly groupId: number;
    readonly groupName: string;
    readonly member: Member;
}

export interface PendingApprovalsResult {
    readonly isLoading: boolean;
    readonly data: PendingApproval[];
}

export function useMyPendingApprovals(): PendingApprovalsResult {
    const api = useApiClient();
    const groupsQuery = useGetGroups();

    const adminGroups = useMemo(
        () => (groupsQuery.data ?? []).filter((g) => g.joinCode != null),
        [groupsQuery.data],
    );

    const pendingQueries = useQueries({
        queries: adminGroups.map((group) => ({
            queryKey: ["groups", group.id, "members", "PENDING"] as const,
            queryFn: async (): Promise<Member[]> => {
                const data = await api.get(`/groups/${group.id}/members?status=PENDING`);
                return MemberSchema.array().parse(data);
            },
        })),
    });

    const isLoading =
        groupsQuery.isLoading || pendingQueries.some((q) => q.isLoading);

    const data = useMemo<PendingApproval[]>(
        () =>
            adminGroups.flatMap((group, i) =>
                (pendingQueries[i].data ?? []).map((member) => ({
                    groupId: group.id,
                    groupName: group.name,
                    member,
                })),
            ),
        [adminGroups, pendingQueries],
    );

    return { isLoading, data };
}

export function useApproveJoinRequest(groupId: number) {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<Member, Error, number>({
        mutationFn: async (memberId): Promise<Member> => {
            const data = await api.post(`/groups/${groupId}/members/${memberId}/approve`);
            return MemberSchema.parse(data);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
        },
    });
}

export function useRejectJoinRequest(groupId: number) {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<Member, Error, number>({
        mutationFn: async (memberId): Promise<Member> => {
            const data = await api.post(`/groups/${groupId}/members/${memberId}/reject`);
            return MemberSchema.parse(data);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
        },
    });
}

export function useCreateGroup() {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<Group, Error, GroupCreate>({
        mutationFn: async (payload): Promise<Group> => {
            const validated = GroupCreateSchema.parse(payload);
            const response = await api.post("/groups", validated);
            return GroupSchema.parse(response);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["groups"] });
        },
    });
}

export function useJoinGroup() {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<JoinRequest, Error, JoinGroup>({
        mutationFn: async (payload): Promise<JoinRequest> => {
            const validated = JoinGroupSchema.parse(payload);
            const response = await api.post("/groups/join", validated);
            return JoinRequestSchema.parse(response);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["groups"] });
            void qc.invalidateQueries({ queryKey: ["join-requests", "mine"] });
        },
    });
}


export function useMyMember(groupId?: number): Member | undefined {
    const [tokenState] = useToken();
    const { data: members } = useGetGroupMembers(groupId, "ACTIVE");

    if (tokenState.state !== "LOGGED_IN" || !members) return undefined;

    const myUsername = TokenService.getUsernameFromToken(tokenState.tokens.accessToken);
    if (!myUsername) return undefined;

    return members.find((m) => m.username === myUsername);
}