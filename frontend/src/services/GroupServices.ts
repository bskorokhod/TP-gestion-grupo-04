import {useQuery} from "@tanstack/react-query";

import {useAccessTokenGetter} from "@/contexts/TokenContext.tsx";
import {Group, GroupSchema} from "@/models/Group.ts";
import {ApiService} from "@/services/ApiServices.ts";

export function useGetGroups() {
    const getAccessToken = useAccessTokenGetter();

    return useQuery({
        queryKey: ["groups"],
        queryFn: async (): Promise<Group[]> => {
            const data = await ApiService.authenticatedRequest<unknown[]>(getAccessToken, "/groups", {
                method: "GET",
            });
            return GroupSchema.array().parse(data);
        },
    });
}
