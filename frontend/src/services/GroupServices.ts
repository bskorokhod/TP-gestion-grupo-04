import { useMemo } from "react";
import {useMutation, useQueries, useQuery, useQueryClient,} from "@tanstack/react-query";
import { useApiClient } from "@/hooks/useApiClient";
import { useToken } from "@/contexts/TokenContext.tsx";
import {Group, GroupCreate, GroupCreateSchema, GroupPreview, GroupPreviewSchema, GroupSchema, JoinGroup, JoinGroupSchema, JOIN_CODE_REGEX, JoinRequest, JoinRequestSchema, Member, MemberSchema, MembershipStatus, PremiumEligibility, PremiumEligibilitySchema, PremiumSubscribe, PremiumSubscribeSchema, PremiumSubscription, PremiumSubscriptionSchema,} from "@/models/Group.ts";
import { getApiErrorStatus } from "@/lib/api.ts";
import { TokenService } from "@/services/TokenService";
import { GROUP_PREVIEW_STALE_TIME_MS, MAX_QUERY_RETRIES } from "@/constants/services.ts";

function retryUnlessClientError(failureCount: number, error: unknown): boolean {
    const status = getApiErrorStatus(error);
    if (status !== null && status >= 400 && status < 500) return false;
    return failureCount < MAX_QUERY_RETRIES;
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
    // /groups/** exige autenticación en el backend, incluido el preview por código: va con el token.
    const api = useApiClient();
    const normalized = joinCode.trim().toUpperCase();
    const enabled = JOIN_CODE_REGEX.test(normalized);

    return useQuery({
        queryKey: ["group-preview", normalized] as const,
        enabled,
        retry: false,
        staleTime: GROUP_PREVIEW_STALE_TIME_MS,
        queryFn: async (): Promise<GroupPreview> => {
            const data = await api.get(`/groups/join/${encodeURIComponent(normalized)}`);
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
            // Aprobar cambia los miembros activos y, con ellos, el estado y los porcentajes del grupo.
            void qc.invalidateQueries({ queryKey: ["groups"] });
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

/**
 * Si al usuario le corresponde la prueba gratuita al suscribir el grupo (una por usuario y una por grupo), para que el
 * formulario de premium no la prometa cuando no va a haberla. Es orientativo: el backend lo vuelve a decidir al
 * suscribir. Cuelga de `["groups"]`, así que suscribir o cancelar en cualquier grupo lo deja stale. `gcTime: 0` evita mostrar
 * al volver a la pantalla una respuesta vieja de otra visita: sin caché, siempre arranca esperando la del backend.
 */
export function useGetPremiumEligibility(groupId: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: ["groups", groupId, "premium-eligibility"] as const,
        enabled: Number.isFinite(groupId) && groupId > 0,
        gcTime: 0,
        retry: retryUnlessClientError,
        queryFn: async (): Promise<PremiumEligibility> => {
            const data = await api.get(`/groups/${groupId}/premium/eligibility`);
            return PremiumEligibilitySchema.parse(data);
        },
    });
}

/**
 * Suscribe el grupo a premium con los datos de pago (simulado: el backend no cobra, solo los registra). Al terminar
 * se invalidan los grupos para que `isPremium` llegue del backend, que es la única fuente de ese estado.
 */
export function useSubscribeGroupPremium(groupId: number) {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<PremiumSubscription, Error, PremiumSubscribe>({
        mutationFn: async (payload): Promise<PremiumSubscription> => {
            const validated = PremiumSubscribeSchema.parse(payload);
            const response = await api.post(`/groups/${groupId}/premium`, validated);
            return PremiumSubscriptionSchema.parse(response);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["groups"] });
        },
    });
}

/**
 * Cancela la suscripción premium del grupo, con efecto inmediato (el backend responde 409 si el grupo no es premium). Al
 * terminar se invalidan los grupos para que `isPremium` llegue del backend, igual que al suscribir. La prueba gratuita
 * consumida no se recupera, y volver a suscribir es `useSubscribeGroupPremium`.
 *
 * TODO(PREMIUM-CANCELLATION-UI): este service todavía no se usa en ninguna pantalla. Falta ubicar en la UI (por ejemplo en
 *  ConfigurationScreen, solo para grupos premium) el control para cancelar, con confirmación previa y toasts de
 *  éxito/error (`useFormToasts`). Lo puede hacer cualquier miembro activo, como al contratar.
 */
export function useCancelGroupPremium(groupId: number) {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<PremiumSubscription, Error, void>({
        mutationFn: async (): Promise<PremiumSubscription> => {
            const response = await api.del(`/groups/${groupId}/premium`);
            return PremiumSubscriptionSchema.parse(response);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["groups"] });
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