import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    User,
    UserSchema,
    UserProfile,
    UserProfileSchema,
    UserPhotoUpdate,
    UserPhotoUpdateSchema,
} from "@/models/User";
import { useApiClient } from "@/hooks/useApiClient";

export function useGetUsers() {
    const api = useApiClient();
    return useQuery({
        queryKey: ["users"] as const,
        queryFn: async (): Promise<User[]> => {
            const data = await api.get<{ results: unknown[] }>("/users");
            return UserSchema.array().parse(data.results);
        },
    });
}

export function useGetUserProfile() {
    const api = useApiClient();
    return useQuery({
        queryKey: ["userProfile"] as const,
        queryFn: async (): Promise<UserProfile> => {
            const data = await api.get<{ results: unknown }>("/users/profile");
            return UserProfileSchema.parse(data.results);
        },
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function useUpdateRole() {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<void, Error, { username: string }>({
        mutationFn: async ({ username }): Promise<void> =>
            api.patch<void>(`/users/${username}`),
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useUpdatePhoto() {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation<void, Error, { newUrl: UserPhotoUpdate }>({
        mutationFn: async ({ newUrl }): Promise<void> => {
            const parsed = UserPhotoUpdateSchema.parse(newUrl);
            return api.patch<void>("/users/profile", parsed);
        },
        onSuccess: (): void => {
            void qc.invalidateQueries({ queryKey: ["userProfile"] });
        },
    });
}