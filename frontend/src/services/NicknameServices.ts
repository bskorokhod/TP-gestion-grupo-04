import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";
import { type Member, MemberSchema } from "@/models/Group.ts";
import {
    type UpdateMyNicknameRequest,
    UpdateMyNicknameRequestSchema,
} from "@/models/Nickname.ts";

/**
 * Cambia el apodo propio dentro del grupo (PATCH /groups/{id}/members/me/nickname). El backend puede
 * reasignar el color si el nuevo apodo entra en conflicto, por eso se invalida la lista de miembros
 * (no solo la propia fila) para que la tarjeta de color quede consistente con el resto.
 */
export function useUpdateMyNickname(groupId: number) {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation<Member, Error, UpdateMyNicknameRequest>({
        mutationFn: async (req): Promise<Member> => {
            const validated = UpdateMyNicknameRequestSchema.parse(req);
            const data = await api.patch(`/groups/${groupId}/members/me/nickname`, validated);
            return MemberSchema.parse(data);
        },
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
        },
    });
}
