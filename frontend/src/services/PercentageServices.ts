import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";
import { type Member, MemberSchema } from "@/models/Group.ts";
import {
    type UpdateMyPercentageRequest,
    UpdateMyPercentageRequestSchema,
} from "@/models/Percentage.ts";

/**
 * Cambia el porcentaje de propiedad del miembro que consulta (PATCH /groups/{id}/members/me/percentage).
 * Es solo para uno mismo y sin aprobación: no toca a los demás. Como puede cambiar el estado del grupo
 * (RUNNING/STOPPED, porcentaje asignado y faltante), se invalida todo lo que cuelga de ["groups"].
 */
export function useUpdateMyPercentage(groupId: number) {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation<Member, Error, UpdateMyPercentageRequest>({
        mutationFn: async (req): Promise<Member> => {
            const validated = UpdateMyPercentageRequestSchema.parse(req);
            const data = await api.patch(`/groups/${groupId}/members/me/percentage`, validated);
            return MemberSchema.parse(data);
        },
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ["groups"] });
        },
    });
}
