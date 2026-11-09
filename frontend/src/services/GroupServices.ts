import { useMemo } from "react";
import {useMutation, useQueries, useQuery, useQueryClient,} from "@tanstack/react-query";
import { useApiClient } from "@/hooks/useApiClient";
import { useToken } from "@/contexts/TokenContext.tsx";
import {Group, GroupCreate, GroupCreateSchema, GroupPreview, GroupPreviewSchema, GroupSchema, JoinGroup, JoinGroupSchema, JOIN_CODE_REGEX, JoinRequest, JoinRequestSchema, Member, MemberSchema, MembershipStatus, PremiumEligibility, PremiumEligibilitySchema, PremiumSubscribe, PremiumSubscribeSchema, PremiumSubscription, PremiumSubscriptionSchema, PremiumStatus, PremiumStatusSchema, PremiumNotice, PremiumNoticeSchema, PremiumPlan, PremiumPlanSchema, LeavePreview, LeavePreviewSchema,} from "@/models/Group.ts";
import { ApiService } from "@/services/ApiServices.ts";
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
 * Cancela el plan premium del grupo. Una prueba termina en el acto y no se puede reactivar; un plan pago deja de renovarse
 * y el grupo lo conserva hasta el fin del período ya pagado, sin reembolso (el backend responde 409 si el grupo no es
 * premium o ya está cancelado). Al terminar se invalidan los grupos para que `isPremium` y el estado del plan lleguen del
 * backend, igual que al suscribir. Lo dispara el menú de la estrella del navbar (`PremiumNavbarItem`).
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

/**
 * Estado del plan premium del grupo (nunca tuvo, en prueba, activo, cancelado pero vigente o terminado), con fechas, pagador
 * y precio. Lo usan el botón del navbar y el dashboard. Cuelga de `["groups"]`, así que suscribir, mejorar o cancelar lo
 * refresca.
 */
export function useGetPremiumStatus(groupId: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: ["groups", groupId, "premium-status"] as const,
        enabled: Number.isFinite(groupId) && groupId > 0,
        retry: retryUnlessClientError,
        queryFn: async (): Promise<PremiumStatus> => {
            const data = await api.get(`/groups/${groupId}/premium`);
            return PremiumStatusSchema.parse(data);
        },
    });
}

/**
 * Oferta del plan premium (precio mensual y días de prueba). Es pública y no depende de ningún grupo ni usuario: va sin
 * token (`ApiService.get`, no el cliente autenticado) para poder consultarse sin sesión.
 */
export function useGetPremiumPlan() {
    return useQuery({
        queryKey: ["premium-plan"] as const,
        retry: retryUnlessClientError,
        queryFn: async (): Promise<PremiumPlan> => {
            const data = await ApiService.get("/groups/premium/plan");
            return PremiumPlanSchema.parse(data);
        },
    });
}

/**
 * Avisos premium que el usuario todavía no vio en este grupo (se muestran como toasts al entrar). Sin caché ni refetch
 * automático: cada entrada al grupo pregunta una vez, y marcar como vistos (`useMarkPremiumNoticesSeen`) los vacía.
 */
export function useGetPremiumNotices(groupId: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: ["premium-notices", groupId] as const,
        enabled: Number.isFinite(groupId) && groupId > 0,
        gcTime: 0,
        staleTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        queryFn: async (): Promise<PremiumNotice[]> => {
            const data = await api.get(`/groups/${groupId}/premium/notices`);
            return PremiumNoticeSchema.array().parse(data);
        },
    });
}

/** Marca como vistos los avisos premium del grupo hasta este momento. */
export function useMarkPremiumNoticesSeen(groupId: number) {
    const api = useApiClient();

    return useMutation<void, Error, void>({
        mutationFn: async (): Promise<void> => {
            await api.post(`/groups/${groupId}/premium/notices/seen`);
        },
    });
}

/** Si al usuario le corresponde la prueba gratuita al crear un grupo premium (el grupo es nuevo: solo cuenta su prueba). */
export function useGetNewPremiumGroupEligibility() {
    const api = useApiClient();
    return useQuery({
        queryKey: ["premium-eligibility", "new-group"] as const,
        gcTime: 0,
        retry: retryUnlessClientError,
        queryFn: async (): Promise<PremiumEligibility> => {
            const data = await api.get("/groups/premium/eligibility");
            return PremiumEligibilitySchema.parse(data);
        },
    });
}

export interface PremiumGroupCreate {
    readonly group: GroupCreate;
    readonly payment: PremiumSubscribe;
}

/**
 * Crea un grupo premium: el grupo, con la configuración elegida, y su suscripción en un solo paso. Si el pago es rechazado
 * (402) no se crea nada. El pago es simulado: una tarjeta terminada en 0002 siempre es rechazada.
 */
export function useCreatePremiumGroup() {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<Group, Error, PremiumGroupCreate>({
        mutationFn: async (payload): Promise<Group> => {
            const body = {
                group: GroupCreateSchema.parse(payload.group),
                payment: PremiumSubscribeSchema.parse(payload.payment),
            };
            const response = await api.post("/groups/premium", body);
            return GroupSchema.parse(response);
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

/**
 * Qué pasaría si el miembro abandona el grupo: si tiene deudas propias sin saldar (no puede irse) y cuánto le deben
 * (lo perdería). Sin caché: cada vez que se abre el diálogo se pregunta de nuevo, porque las deudas cambian.
 */
export function useGetLeavePreview(groupId: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: ["groups", groupId, "leave-preview"] as const,
        enabled: Number.isFinite(groupId) && groupId > 0,
        gcTime: 0,
        staleTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        queryFn: async (): Promise<LeavePreview> => {
            const data = await api.get(`/groups/${groupId}/leave-preview`);
            return LeavePreviewSchema.parse(data);
        },
    });
}

/** Abandona el grupo (`DELETE /groups/:id/members/me`, 204). Al terminar se refrescan los grupos del usuario. */
export function useLeaveGroup(groupId: number) {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async (): Promise<void> => {
            await api.del(`/groups/${groupId}/members/me`);
        },
        onSuccess: (): void => {
            qc.removeQueries({ queryKey: ["groups", groupId] });
            void qc.invalidateQueries({ queryKey: ["groups"] });
        },
    });
}
