import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";
import { type Member, MemberSchema } from "@/models/Group.ts";
import { type UpdateMyCvuRequest, UpdateMyCvuRequestSchema } from "@/models/Cvu.ts";

/**
 * Cambia el alias/CVU propio dentro del grupo (PATCH /groups/{id}/members/me/cvu); un valor vacío lo borra.
 * Además de la lista de miembros se invalidan los gastos, porque cada deuda lleva el alias/CVU de su acreedor.
 */
export function useUpdateMyCvu(groupId: number) {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation<Member, Error, UpdateMyCvuRequest>({
        mutationFn: async (req): Promise<Member> => {
            const validated = UpdateMyCvuRequestSchema.parse(req);
            const data = await api.patch(`/groups/${groupId}/members/me/cvu`, validated);
            return MemberSchema.parse(data);
        },
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
            void queryClient.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
        },
    });
}
