import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient.ts";
import { CancellationRequest, CancellationRequestCreateSchema, CancellationRequestSchema, Reservation, ReservationCreate, ReservationCreateSchema, ReservationSchema, } from "@/models/Reservation.ts";
import { RESERVATIONS_REFETCH_INTERVAL_MS } from "@/constants/services.ts";

const reservationsKey = (groupId: number) => ["groups", groupId, "reservations"] as const;
const cancellationRequestsKey = (groupId: number) =>
    ["groups", groupId, "reservation-cancellation-requests"] as const;

export function useGetReservations(groupId: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: reservationsKey(groupId),
        enabled: Number.isFinite(groupId) && groupId > 0,
        refetchInterval: RESERVATIONS_REFETCH_INTERVAL_MS,
        refetchOnWindowFocus: true,
        queryFn: async (): Promise<Reservation[]> => {
            const data = await api.get(`/groups/${groupId}/reservations`);
            return ReservationSchema.array().parse(data);
        },
    });
}

export function useCreateReservation(groupId: number) {
    const api = useApiClient();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: ReservationCreate): Promise<Reservation> => {
            const validated = ReservationCreateSchema.parse(payload);
            const data = await api.post(`/groups/${groupId}/reservations`, validated);
            return ReservationSchema.parse(data);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: reservationsKey(groupId) });
        },
    });
}

export function useCancelReservation(groupId: number) {
    const api = useApiClient();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (reservationId: number): Promise<void> => {
            await api.del(`/groups/${groupId}/reservations/${reservationId}`);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: reservationsKey(groupId) });
        },
    });
}

export function useRequestReservationCancellation(groupId: number) {
    const api = useApiClient();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
                               reservationId,
                               reason,
                           }: { reservationId: number; reason: string }): Promise<CancellationRequest> => {
            const validated = CancellationRequestCreateSchema.parse({ reason });
            const data = await api.post(
                `/groups/${groupId}/reservations/${reservationId}/cancellation-requests`,
                validated,
            );
            return CancellationRequestSchema.parse(data);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: reservationsKey(groupId) });
            void queryClient.invalidateQueries({ queryKey: cancellationRequestsKey(groupId) });
        },
    });
}

export function useGetCancellationRequests(groupId: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: cancellationRequestsKey(groupId),
        enabled: Number.isFinite(groupId) && groupId > 0,
        queryFn: async (): Promise<CancellationRequest[]> => {
            const data = await api.get(`/groups/${groupId}/reservation-cancellation-requests`);
            return CancellationRequestSchema.array().parse(data);
        },
    });
}