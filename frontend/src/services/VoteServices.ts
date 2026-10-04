import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";
import type { ExpenseData } from "@/models/Expense";
import { CastBallotInput, ConfigChangeCreate, Vote, VoteSchema } from "@/models/Vote";

/** Votaciones activas visibles para el usuario. Las finalizadas no se listan (quedan guardadas para el historial). */
export function useGetVotes(groupId?: number) {
    const api = useApiClient();

    return useQuery({
        queryKey: ["groups", groupId, "votes"] as const,
        enabled: typeof groupId === "number" && Number.isFinite(groupId) && groupId > 0,
        queryFn: async (): Promise<Vote[]> => {
            const data = await api.get(`/groups/${groupId}/votes`);
            return VoteSchema.array().parse(data);
        },
    });
}

/**
 * Propone un gasto que alcanza el umbral extraordinario. Devuelve la votación: si ya quedó resuelta
 * (p. ej. el único involucrado es quien lo propone) `status` es FINALIZED y `outcome` dice qué pasó.
 */
export function useCreateExtraordinaryExpenseVote(groupId: number) {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<Vote, Error, ExpenseData>({
        mutationFn: async (payload): Promise<Vote> => {
            const response = await api.post(`/groups/${groupId}/votes/extraordinary-expense`, payload);
            return VoteSchema.parse(response);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["groups", groupId, "votes"] });
            // Si la votación se resolvió en el acto, el gasto ya existe.
            void qc.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
        },
    });
}

/**
 * Propone cambiar una configuración del grupo (votación unánime). Devuelve la votación: si ya quedó resuelta
 * (p. ej. quien propone es el único miembro activo) `status` es FINALIZED y `outcome` dice qué pasó.
 */
export function useCreateConfigChangeVote(groupId: number) {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<Vote, Error, ConfigChangeCreate>({
        mutationFn: async (payload): Promise<Vote> => {
            const response = await api.post(`/groups/${groupId}/votes/config-change`, payload);
            return VoteSchema.parse(response);
        },
        onSuccess: (): void => {
            // Si la votación se resolvió en el acto, la configuración del grupo ya cambió.
            void qc.invalidateQueries({ queryKey: ["groups"] });
        },
    });
}

/** Emite o cambia el voto propio. Si el resultado queda determinado, el gasto se crea (o no) al instante. */
export function useCastBallot(groupId: number) {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<Vote, Error, CastBallotInput>({
        mutationFn: async ({ voteId, choice }): Promise<Vote> => {
            const response = await api.put(`/groups/${groupId}/votes/${voteId}/ballot`, { choice });
            return VoteSchema.parse(response);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["groups", groupId, "votes"] });
            void qc.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
            // El último voto de un cambio de configuración la aplica: hay que refrescar el grupo.
            void qc.invalidateQueries({ queryKey: ["groups"], exact: false });
        },
    });
}
