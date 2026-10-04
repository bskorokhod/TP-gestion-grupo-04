import { useMemo, useState } from "react";

import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { GroupStoppedBanner } from "@/components/GroupStoppedBanner.tsx";
import { Avatar } from "@/components/ui/Avatar.tsx";
import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { useMyMember } from "@/hooks/useMyMember.ts";
import { useToast } from "@/hooks/useToast.ts";
import { getApiErrorStatus } from "@/lib/api.ts";
import type { Member } from "@/models/Group.ts";
import { useGetGroupMembers } from "@/services/GroupServices.ts";
import {
  useCancelReservation,
  useCreateReservation,
  useGetCancellationRequests,
  useGetReservations,
  useRequestReservationCancellation,
} from "@/services/ReservationServices.ts";

type Reservation = {
  id: number;
  start: string;
  end: string;
  memberId: number;
  memberName: string;
  memberColor?: Member["color"];
  createdAt: string;
  cancellationStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  cancellationReason?: string;
};
const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function tomorrowKey() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateKey(tomorrow);
}
function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return parseDate(value).toLocaleDateString("es-AR", options ?? { day: "numeric", month: "short" });
}
function sameDay(a: string, b: string) {
  return a === b;
}
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}
function calendarDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
function daysBookedInMonth(reservations: Reservation[], memberId: number | undefined, month: Date) {
  if (memberId === undefined) return 0;
  const monthStart = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const monthEnd = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  return reservations
    .filter((reservation) => reservation.memberId === memberId)
    .reduce((total, reservation) => {
      const start = reservation.start > monthStart ? reservation.start : monthStart;
      const end = reservation.end < monthEnd ? reservation.end : monthEnd;
      if (start > end) return total;
      return total + (parseDate(end).getTime() - parseDate(start).getTime()) / 86400000 + 1;
    }, 0);
}

export function ReservationsGroupScreen() {
  const group = useCurrentGroup();
  const myMember = useMyMember(group.id);
  const { data: members = [] } = useGetGroupMembers(group.id, "ACTIVE");
  const { data: backendReservations = [], isLoading, isError } = useGetReservations(group.id);
  const { data: cancellationRequests = [] } = useGetCancellationRequests(group.id);
  const createReservation = useCreateReservation(group.id);
  const cancelReservation = useCancelReservation(group.id);
  const requestCancellationMutation = useRequestReservationCancellation(group.id);
  const { toast } = useToast();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<number | null>(null);
  const reservations = useMemo<Reservation[]>(
    () =>
      backendReservations
        .filter((reservation) => reservation.status === "ACTIVE")
        .map((reservation) => {
          const cancellation = cancellationRequests.find(
            (request) => request.reservationId === reservation.id && request.status === "PENDING",
          );
          return {
            id: reservation.id,
            start: reservation.startDate,
            end: reservation.endDate,
            memberId: reservation.memberId,
            memberName: reservation.memberNickname,
            memberColor: reservation.memberColor,
            createdAt: reservation.createdAt,
            cancellationStatus: cancellation?.status ?? "NONE",
            cancellationReason: cancellation?.reason,
          };
        }),
    [backendReservations, cancellationRequests],
  );
  const firstBookableDate = tomorrowKey();
  // Con el grupo detenido no se puede reservar; sí se pueden cancelar reservas (propias o solicitar la de otros).
  const groupStopped = group.status === "STOPPED";
  const firstWeekday = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );
  const rangeIsComplete = Boolean(rangeStart && rangeEnd);
  const visibleMonthDays = calendarDaysInMonth(visibleMonth);
  const monthlyReservationLimit =
    group.settings.reservationLimitPolicy === "FIXED_DAYS_PER_MONTH"
      ? group.settings.reservationFixedDaysPerMonth ?? 0
      : group.settings.reservationLimitPolicy === "OWNERSHIP_PROPORTIONAL"
        ? Math.floor((visibleMonthDays * (myMember?.percentage ?? 0)) / 100)
        : Math.floor(visibleMonthDays / Math.max(members.length, 1));
  const monthlyBookedDays = daysBookedInMonth(reservations, myMember?.id, visibleMonth);
  const monthlyRemainingDays = Math.max(monthlyReservationLimit - monthlyBookedDays, 0);

  const reservationsForDate = (key: string) =>
    reservations.filter((reservation) => reservation.start <= key && key <= reservation.end);
  const onChooseDate = (key: string) => {
    if (key < firstBookableDate) {
      toast({
        title: "Fecha no disponible",
        description: "Las reservas deben comenzar como mínimo mañana.",
        variant: "destructive",
      });
      return;
    }
    if (reservationsForDate(key).length) {
      const reservation = reservationsForDate(key)[0];
      setSelectedReservation(reservation.id);
      toast({
        title: `Reservado por ${reservation.memberName}`,
        description: `${formatDate(reservation.start)} al ${formatDate(reservation.end)}`,
      });
      return;
    }
    setSelectedReservation(null);
    // Los días ya reservados siguen siendo seleccionables (para cancelar); iniciar una reserva nueva no.
    if (groupStopped) {
      toast({
        title: "Grupo detenido",
        description: "No podés iniciar una reserva hasta que los porcentajes del grupo sumen 100%.",
        variant: "destructive",
      });
      return;
    }
    if (!rangeStart || rangeEnd || key < rangeStart) {
      setRangeStart(key);
      setRangeEnd(null);
    } else {
      const conflict = reservations.some((reservation) =>
        overlaps(rangeStart, key, reservation.start, reservation.end),
      );
      if (conflict) {
        toast({
          title: "Fechas no disponibles",
          description: "El rango incluye días reservados por otro miembro.",
          variant: "destructive",
        });
        setRangeStart(key);
        setRangeEnd(null);
        return;
      }
      setRangeEnd(key);
    }
  };

  const confirmReservation = async () => {
    if (groupStopped) {
      toast({
        title: "Grupo detenido",
        description: "El grupo no puede tomar reservas hasta que los porcentajes sumen 100%.",
        variant: "destructive",
      });
      return;
    }
    if (!rangeStart || !rangeEnd) {
      toast({
        title: "Seleccioná un rango completo",
        description: "Elegí una fecha de inicio y una fecha de fin.",
        variant: "destructive",
      });
      return;
    }
    const start = rangeStart < rangeEnd ? rangeStart : rangeEnd;
    const end = rangeStart < rangeEnd ? rangeEnd : rangeStart;
    if (start < firstBookableDate) {
      toast({
        title: "Fecha no disponible",
        description: "Las reservas deben comenzar como mínimo mañana.",
        variant: "destructive",
      });
      return;
    }
    if (reservations.some((reservation) => overlaps(start, end, reservation.start, reservation.end))) {
      toast({
        title: "Fechas no disponibles",
        description: "Otro miembro ya reservó parte de ese rango.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createReservation.mutateAsync({ startDate: start, endDate: end });
      setRangeStart(null);
      setRangeEnd(null);
      toast({
        title: "Reserva confirmada",
        description: `${formatDate(start)} al ${formatDate(end)}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      const monthlyLimitError = errorMessage.toLowerCase().includes("límite mensual");
      const conflict = getApiErrorStatus(error) === 409;
      toast({
        title: monthlyLimitError
          ? "Límite mensual alcanzado"
          : conflict
            ? "No pudimos guardar tu reserva"
            : "No se pudo crear la reserva",
        description: monthlyLimitError
          ? `Solo podés reservar ${monthlyRemainingDays} día${monthlyRemainingDays === 1 ? "" : "s"} más durante este mes.`
          : conflict
            ? "Ese período dejó de estar disponible. Elegí otras fechas e intentá nuevamente."
            : errorMessage || "Revisá las fechas seleccionadas.",
        variant: "destructive",
      });
    }
  };

  const cancelOwnReservation = async (reservation: Reservation) => {
    if (reservation.memberId !== myMember?.id) {
      toast({
        title: "No podés cancelar esta reserva directamente",
        description: "Las reservas ajenas requieren una solicitud y votación del grupo.",
        variant: "destructive",
      });
      return;
    }
    try {
      await cancelReservation.mutateAsync(reservation.id);
      setSelectedReservation(null);
      toast({
        title: "Reserva cancelada",
        description: "La reserva propia fue cancelada correctamente.",
      });
    } catch (error) {
      toast({
        title: "No se pudo cancelar la reserva",
        description: error instanceof Error ? error.message : "Intentá nuevamente.",
        variant: "destructive",
      });
    }
  };

  const requestCancellation = async (reservation: Reservation, reason: string) => {
    if (reservation.memberId === myMember?.id) {
      await cancelOwnReservation(reservation);
      return;
    }
    if (reservation.cancellationStatus === "PENDING") {
      toast({
        title: "Solicitud ya enviada",
        description: "El grupo todavía debe votar esta cancelación.",
      });
      return;
    }
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      toast({
        title: "Falta el motivo",
        description: "Explicá por qué querés solicitar la cancelación de esta reserva.",
        variant: "destructive",
      });
      return;
    }
    try {
      await requestCancellationMutation.mutateAsync({
        reservationId: reservation.id,
        reason: normalizedReason,
      });
      toast({
        title: "Solicitud de cancelación enviada",
        description: `La solicitud queda sujeta a ${votingModelLabel(group.settings.votingModel)}.`,
      });
    } catch (error) {
      toast({
        title: "No se pudo enviar la solicitud",
        description: error instanceof Error ? error.message : "Intentá nuevamente.",
        variant: "destructive",
      });
    }
  };

  const navigateMonth = (amount: number) => {
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    setVisibleMonth((month) => {
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + amount, 1);
      return nextMonth < currentMonth ? currentMonth : nextMonth;
    });
  };

  return (
    <CommonLayout className="min-h-screen bg-background font-poppins text-foreground flex flex-col">
      <GroupNavbar>
        <div className="grid grid-cols-3 divide-x divide-brand/20 rounded-full bg-panel px-5 py-3 text-foreground shadow-panel sm:px-7">
          <div className="pr-4">
            <strong className="block text-lg font-black text-brand sm:text-xl">{reservations.length}</strong>
            <span className="text-[10px] font-medium uppercase text-brand">Reservas</span>
          </div>
          <div className="px-4">
            <strong className="block text-lg font-black text-group-green sm:text-xl">
              {reservations.reduce(
                (total, reservation) =>
                  total +
                  (parseDate(reservation.end).getTime() - parseDate(reservation.start).getTime()) / 86400000 +
                  1,
                0,
              )}
            </strong>
            <span className="text-[10px] font-medium uppercase text-brand">Días tomados</span>
          </div>
          <div className="pl-4">
            <strong className="block text-lg font-black text-brand sm:text-xl">{members.length}</strong>
            <span className="text-[10px] font-medium uppercase text-brand">Miembros</span>
          </div>
        </div>
      </GroupNavbar>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:px-10">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold capitalize text-group-heading">
              {visibleMonth.toLocaleDateString("es-AR", { month: "long" })}{" "}
              <span className="font-normal text-group-muted">{visibleMonth.getFullYear()}</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                aria-label="Mes anterior"
                disabled={
                  visibleMonth.getFullYear() === new Date().getFullYear() &&
                  visibleMonth.getMonth() === new Date().getMonth()
                }
                className="grid size-8 place-items-center rounded-full border border-brand/30 text-brand hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                aria-label="Mes siguiente"
                className="grid size-8 place-items-center rounded-full border border-brand/30 text-brand hover:bg-brand/10"
              >
                ›
              </button>
              <button
                type="button"
                onClick={confirmReservation}
                disabled={groupStopped}
                className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Reservar
              </button>
            </div>
          </div>

          <GroupStoppedBanner className="mb-4" />
          {isLoading && <p className="mb-3 text-sm text-group-muted">Cargando reservas...</p>}
          {isError && (
            <p role="alert" className="mb-3 rounded-xl bg-group-danger-soft px-4 py-3 text-sm text-group-danger">
              No se pudieron cargar las reservas. Intentá actualizar la página.
            </p>
          )}
          <p className="mb-3 text-sm text-group-muted">
            {rangeStart
              ? rangeEnd
                ? `Rango seleccionado: ${formatDate(rangeStart)} al ${formatDate(rangeEnd)}`
                : `Inicio: ${formatDate(rangeStart)} · elegí la fecha de fin`
              : "Seleccioná una fecha de inicio y otra de fin."}
          </p>
          <p className="mb-4 rounded-xl bg-panel px-4 py-3 text-xs text-group-muted">
            Tu límite para{" "}
            <strong>
              {visibleMonth.toLocaleDateString("es-AR", { month: "long" })}
            </strong>{" "}
            es de <strong>{monthlyReservationLimit} días</strong>. Ya tenés{" "}
            <strong>{monthlyBookedDays} reservados</strong> y te quedan{" "}
            <strong>{monthlyRemainingDays} disponibles</strong>
            {group.settings.reservationLimitPolicy === "OWNERSHIP_PROPORTIONAL" &&
              ` según tu ${myMember?.percentage ?? 0}% de propiedad.`}
          </p>

          <div className="grid grid-cols-7 gap-2 text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="pb-1 text-[10px] font-semibold uppercase text-group-muted">
                {day}
              </div>
            ))}
            {monthDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} aria-hidden className="min-h-12 sm:min-h-16" />;
              const key = dateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
              const booking = reservationsForDate(key)[0];
              const inRange = Boolean(
                rangeStart &&
                  rangeEnd &&
                  key >= (rangeStart < rangeEnd ? rangeStart : rangeEnd) &&
                  key <= (rangeStart < rangeEnd ? rangeEnd : rangeStart),
              );
              const isStart = sameDay(key, rangeStart ?? "");
              const isEnd = sameDay(key, rangeEnd ?? "");
              const selected = selectedReservation && booking?.id === selectedReservation;
              const unavailable = key < firstBookableDate;
              const color = booking ? memberColorClass(booking.memberColor) : "";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChooseDate(key)}
                  disabled={unavailable || (groupStopped && !booking)}
                  aria-label={`${day} ${visibleMonth.toLocaleDateString("es-AR", { month: "long" })}${booking ? `, reservado por ${booking.memberName}, ${formatDate(booking.start)} al ${formatDate(booking.end)}` : ", disponible"}`}
                  aria-pressed={isStart || isEnd || Boolean(selected)}
                  className={`relative flex min-h-12 flex-col items-center justify-center overflow-hidden rounded-xl px-1 py-2 text-xs transition sm:min-h-16 ${unavailable || (groupStopped && !booking) ? "cursor-not-allowed bg-background text-group-muted/50" : "hover:ring-2 hover:ring-brand/40"} ${booking ? `${color} text-white` : "bg-panel text-foreground shadow-sm"} ${inRange || isStart || isEnd ? "ring-2 ring-brand" : ""} ${selected ? "outline outline-2 outline-offset-2 outline-brand" : ""}`}
                >
                {unavailable && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[-12%] top-1/2 h-px w-[124%] rotate-[-25deg] bg-group-muted/60"
                  />
                )}
                <span>{day}</span>
                  {booking && (
                    <span className="mt-0.5 max-w-full truncate text-[9px] opacity-90">{booking.memberName}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-group-muted">
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-brand" />
              Tu reserva
            </span>
            {members.slice(0, 4).map((member) => (
              <span key={member.id} className="flex items-center gap-1.5">
                <i className={`size-2 rounded-full ${memberColorClass(member.color)}`} />
                {member.nickname}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-panel ring-1 ring-black/10" />
              Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-background ring-1 ring-black/10" />
              No disponible para reservar
            </span>
          </div>
          {rangeIsComplete && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-panel p-4 shadow-group">
              <p className="text-sm">
                Reservar del <strong>{formatDate(rangeStart!)}</strong> al <strong>{formatDate(rangeEnd!)}</strong>
              </p>
              <button
                type="button"
                onClick={confirmReservation}
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
              >
                Confirmar reserva
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-7">
          <section>
            <h3 className="mb-4 text-base font-bold text-group-heading">Actividad</h3>
            {reservations.length === 0 ? (
              <p className="text-sm text-group-muted">Todavía no hay reservas. Todas las fechas están disponibles.</p>
            ) : (
              <ul className="space-y-4">
                {[...reservations]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 6)
                  .map((reservation) => (
                    <li key={reservation.id} className="flex gap-3">
                      <Avatar name={reservation.memberName} color={reservation.memberColor} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-group-heading">{reservation.memberName}</p>
                        <p className="text-xs text-group-muted">
                          {formatDate(reservation.start)} al {formatDate(reservation.end)}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </section>
          <section className="border-t border-brand/10 pt-5">
            <h3 className="mb-4 text-sm font-bold text-group-heading">Miembros del grupo</h3>
            <div className="flex flex-wrap items-center gap-1">
              {members.map((member) => (
                <span key={member.id} title={member.nickname}>
                  <Avatar name={member.nickname} color={member.color} size="sm" className="ring-2 ring-background" />
                </span>
              ))}
            </div>
          </section>
          {selectedReservation && (
            <ReservationDetail
              reservation={reservations.find((item) => item.id === selectedReservation)}
              isOwnReservation={Boolean(
                reservations.find((item) => item.id === selectedReservation)?.memberId === myMember?.id,
              )}
              onCancelOwn={cancelOwnReservation}
              onRequestCancellation={requestCancellation}
              onClose={() => setSelectedReservation(null)}
            />
          )}
        </aside>
      </section>
    </CommonLayout>
  );
}

function ReservationDetail({
  reservation,
  isOwnReservation,
  onCancelOwn,
  onRequestCancellation,
  onClose,
}: {
  reservation?: Reservation;
  isOwnReservation: boolean;
  onCancelOwn: (reservation: Reservation) => void;
  onRequestCancellation: (reservation: Reservation, reason: string) => void;
  onClose: () => void;
}) {
  if (!reservation) return null;

  return (
    <section className="border-t border-brand/10 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-group-heading">Detalle de reserva</h3>
          <p className="mt-1 text-xs text-group-muted">
            {reservation.memberName} · {formatDate(reservation.start)} al {formatDate(reservation.end)}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-brand underline">
          Cerrar
        </button>
      </div>
      {reservation.cancellationStatus === "PENDING" ? (
        <p className="mt-3 rounded-lg bg-group-danger-soft px-3 py-2 text-xs text-group-danger">
          Cancelación pendiente de votación del grupo.
          {reservation.cancellationReason && (
            <span className="mt-1 block">Motivo: {reservation.cancellationReason}</span>
          )}
        </p>
      ) : isOwnReservation ? (
        <button
          type="button"
          onClick={() => onCancelOwn(reservation)}
          className="mt-3 rounded-full border border-group-danger/30 px-3 py-2 text-xs font-semibold text-group-danger hover:bg-group-danger-soft"
        >
          Cancelar mi reserva
        </button>
      ) : null}
      {!isOwnReservation && reservation.cancellationStatus !== "PENDING" && (
        <CancellationRequestForm reservation={reservation} onSubmit={onRequestCancellation} />
      )}
    </section>
  );
}

function CancellationRequestForm({
  reservation,
  onSubmit,
}: {
  reservation: Reservation;
  onSubmit: (reservation: Reservation, reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <form
      className="mt-4 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(reservation, reason);
      }}
    >
      <label htmlFor={`cancellation-reason-${reservation.id}`} className="block text-xs font-semibold text-group-heading">
        ¿Por qué querés cancelar esta reserva?
      </label>
      <textarea
        id={`cancellation-reason-${reservation.id}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Explicá el motivo para que el grupo pueda evaluarlo"
        required
        maxLength={500}
        rows={3}
        className="w-full resize-none rounded-xl border border-brand/20 bg-panel px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
      />
      <button
        type="submit"
        className="rounded-full border border-group-danger/30 px-3 py-2 text-xs font-semibold text-group-danger hover:bg-group-danger-soft"
      >
        Solicitar cancelación al grupo
      </button>
    </form>
  );
}

function votingModelLabel(model: string) {
  switch (model) {
    case "UNANIMOUS":
      return "votación unánime";
    case "OWNERSHIP_WEIGHTED_MAJORITY":
      return "mayoría proporcional al porcentaje de propiedad";
    default:
      return "mayoría simple";
  }
}

function memberColorClass(color?: Member["color"]) {
  const colors: Record<Member["color"], string> = {
    RED: "bg-avatar-custom-red",
    BLUE: "bg-avatar-custom-blue",
    GREEN: "bg-avatar-custom-green",
    YELLOW: "bg-avatar-custom-yellow",
    ORANGE: "bg-avatar-custom-orange",
    PURPLE: "bg-avatar-custom-purple",
    PINK: "bg-avatar-custom-pink",
    LIGHT_BLUE: "bg-avatar-custom-light-blue",
  };
  return color ? colors[color] : "bg-group-green";
}
