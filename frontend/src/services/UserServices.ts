import { useAccessTokenGetter } from "@/contexts/TokenContext.tsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, UserSchema, UserProfile, UserProfileSchema, UserPhotoUpdate, UserPhotoUpdateSchema,} from "@/models/User";
import { ApiService } from "@/services/ApiServices";

export function useGetUsers() {
    const getAccessToken = useAccessTokenGetter();

    return useQuery({
        queryKey: ["users"],
        queryFn: async (): Promise<User[]> => {
            const data = await ApiService.authenticatedRequest<{ results: unknown[] }>( getAccessToken, "/users", { method: "GET" });
            return UserSchema.array().parse(data.results);
        },
    });
}

export function useGetUserProfile() {
    const getAccessToken = useAccessTokenGetter();

    return useQuery({
        queryKey: ["userProfile"],
        queryFn: async (): Promise<UserProfile> => {
            const data = await ApiService.authenticatedRequest<{ results: unknown }>(getAccessToken, "/users/profile", { method: "GET" });
            return UserProfileSchema.parse(data.results);
        },
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function useUpdateRole() {
    const getAccessToken = useAccessTokenGetter();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { username: string }) =>
            ApiService.authenticatedRequest<void>(getAccessToken, `/users/${payload.username}`, {
                method: "PATCH",
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    });
}


export function useUpdatePhoto() {
    const getAccessToken = useAccessTokenGetter();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { newUrl: UserPhotoUpdate }) => {
            const parsed = UserPhotoUpdateSchema.parse(payload.newUrl);
            return ApiService.authenticatedRequest<void>(getAccessToken, "/users/profile", {method: "PATCH", body: JSON.stringify(parsed),});
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["userProfile"] }),
    });
}
