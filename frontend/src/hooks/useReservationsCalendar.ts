import { useMemo, useState } from "react";

import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { useMyMember } from "@/hooks/useMyMember.ts";
import { useToast } from "@/hooks/useToast.ts";
import { getApiErrorStatus } from "@/lib/api.ts";
import { dateKey, daysBetween, daysInMonth, formatDate, monthStart, overlaps, tomorrowKey } from "@/lib/dates.ts";
import type { Reservation } from "@/models/Reservation.ts";
import { useGetGroupMembers } from "@/services/GroupServices.ts";
import {
    useCancelReservation,
    useCreateReservation,
    useGetCancellationRequests,
    useGetReservations,
    useRequestReservationCancellation,
} from "@/services/ReservationServices.ts";

interface DateRange {
    start: string | null;
    end: string | null;
}

interface Message {
    title: string;
    description: string;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };

const VOTING_MODEL_LABELS: Record<string, string> = {
    UNANIMOUS: "votación unánime",
    OWNERSHIP_WEIGHTED_MAJORITY: "mayoría proporcional al porcentaje de propiedad",
};

function daysBookedInMonth(reservations: Reservation[], memberId: number | undefined, month: Date): number {
    if (memberId === undefined) return 0;
    const first = dateKey(monthStart(month));
    const last = dateKey(new Date(month.getFullYear(), month.getMonth(), daysInMonth(month)));
    return reservations
        .filter((reservation) => reservation.memberId === memberId)
        .reduce((total, reservation) => {
            const start = reservation.startDate > first ? reservation.startDate : first;
            const end = reservation.endDate < last ? reservation.endDate : last;
            return start > end ? total : total + daysBetween(start, end);
        }, 0);
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Intentá nuevamente.";
}

/**
 * Estado, reglas y acciones de la pantalla de reservas.
 *
 * Los toasts quedan solo para el resultado de acciones asincrónicas y para el conflicto al elegir un rango:
 * el resto de los estados inválidos (fecha pasada, grupo detenido, motivo vacío) se evitan deshabilitando la UI.
 */
export function useReservationsCalendar() {
    const group = useCurrentGroup();
    const myMember = useMyMember(group.id);
    const { data: members = [] } = useGetGroupMembers(group.id, "ACTIVE");
    const { data: backendReservations = [], isLoading, isError } = useGetReservations(group.id);
    const { data: cancellationRequests = [] } = useGetCancellationRequests(group.id);
    const createReservation = useCreateReservation(group.id);
    const cancelReservation = useCancelReservation(group.id);
    const requestCancellationMutation = useRequestReservationCancellation(group.id);
    const { toast } = useToast();

    const [visibleMonth, setVisibleMonth] = useState(() => monthStart(new Date()));
    const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const reservations = useMemo(
        () => backendReservations.filter((reservation) => reservation.status === "ACTIVE"),
        [backendReservations],
    );
    // reservationId -> motivo de la cancelación pendiente de votación.
    const pendingReasons = useMemo(
        () =>
            new Map<number, string>(
                cancellationRequests
                    .filter((request) => request.status === "PENDING")
                    .map((request) => [request.reservationId, request.reason] as const),
            ),
        [cancellationRequests],
    );
    const selected = reservations.find((reservation) => reservation.id === selectedId);

    // Con el grupo detenido no se puede reservar; sí se pueden cancelar reservas (propias o solicitar la de otros).
    const groupStopped = group.status === "STOPPED";
    const firstBookableDate = tomorrowKey();

    const policy = group.settings.reservationLimitPolicy;
    const monthDays = daysInMonth(visibleMonth);
    const limitTotal =
        policy === "FIXED_DAYS_PER_MONTH"
            ? (group.settings.reservationFixedDaysPerMonth ?? 0)
            : policy === "OWNERSHIP_PROPORTIONAL"
              ? Math.floor((monthDays * (myMember?.percentage ?? 0)) / 100)
              : Math.floor(monthDays / Math.max(members.length, 1));
    const limitBooked = daysBookedInMonth(reservations, myMember?.id, visibleMonth);
    const limitRemaining = Math.max(limitTotal - limitBooked, 0);

    const reservationOn = (key: string) =>
        reservations.find((reservation) => reservation.startDate <= key && key <= reservation.endDate);

    /** Ejecuta una acción y muestra un único toast de éxito o de error. Devuelve si salió bien. */
    const run = async (
        action: () => Promise<unknown>,
        success: Message,
        failureTitle: string,
        describeError: (error: unknown) => string = errorMessage,
    ): Promise<boolean> => {
        try {
            await action();
            toast(success);
            return true;
        } catch (error) {
            toast({ title: failureTitle, description: describeError(error), variant: "destructive" });
            return false;
        }
    };

    const describeCreateError = (error: unknown): string => {
        const message = error instanceof Error ? error.message : "";
        if (message.toLowerCase().includes("límite mensual")) {
            return `Solo podés reservar ${limitRemaining} día${limitRemaining === 1 ? "" : "s"} más durante este mes.`;
        }
        if (getApiErrorStatus(error) === 409) {
            return "Ese período dejó de estar disponible. Elegí otras fechas e intentá nuevamente.";
        }
        return message || "Revisá las fechas seleccionadas.";
    };

    const chooseDate = (key: string) => {
        const booking = reservationOn(key);
        setSelectedId(booking?.id ?? null);
        if (booking) return;

        const { start, end } = range;
        if (!start || end || key < start) {
            setRange({ start: key, end: null });
            return;
        }
        if (reservations.some((reservation) => overlaps(start, key, reservation.startDate, reservation.endDate))) {
            toast({
                title: "Fechas no disponibles",
                description: "El rango incluye días reservados por otro miembro.",
                variant: "destructive",
            });
            setRange({ start: key, end: null });
            return;
        }
        setRange({ start, end: key });
    };

    const confirm = async () => {
        const { start, end } = range;
        if (!start || !end) return;
        const ok = await run(
            () => createReservation.mutateAsync({ startDate: start, endDate: end }),
            { title: "Reserva confirmada", description: `${formatDate(start)} al ${formatDate(end)}` },
            "No se pudo crear la reserva",
            describeCreateError,
        );
        if (ok) setRange(EMPTY_RANGE);
    };

    const cancelOwn = async () => {
        if (!selected) return;
        const ok = await run(
            () => cancelReservation.mutateAsync(selected.id),
            { title: "Reserva cancelada", description: "La reserva propia fue cancelada correctamente." },
            "No se pudo cancelar la reserva",
        );
        if (ok) setSelectedId(null);
    };

    const requestCancellation = async (reason: string) => {
        if (!selected) return;
        await run(
            () => requestCancellationMutation.mutateAsync({ reservationId: selected.id, reason: reason.trim() }),
            {
                title: "Solicitud de cancelación enviada",
                description: `La solicitud queda sujeta a ${VOTING_MODEL_LABELS[group.settings.votingModel] ?? "mayoría simple"}.`,
            },
            "No se pudo enviar la solicitud",
        );
    };

    const navigateMonth = (amount: number) => {
        setVisibleMonth((month) => {
            const next = new Date(month.getFullYear(), month.getMonth() + amount, 1);
            const current = monthStart(new Date());
            return next < current ? current : next;
        });
    };

    return {
        members,
        reservations,
        isLoading,
        isError,
        groupStopped,
        firstBookableDate,
        visibleMonth,
        canGoBack: visibleMonth > monthStart(new Date()),
        navigateMonth,
        reservationOn,
        range,
        selected,
        pendingReasons,
        myMemberId: myMember?.id,
        limit: {
            total: limitTotal,
            booked: limitBooked,
            remaining: limitRemaining,
            ownershipPercentage: policy === "OWNERSHIP_PROPORTIONAL" ? (myMember?.percentage ?? 0) : undefined,
        },
        chooseDate,
        confirm,
        cancelOwn,
        requestCancellation,
        closeDetail: () => setSelectedId(null),
    };
}

export type ReservationsCalendarState = ReturnType<typeof useReservationsCalendar>;
