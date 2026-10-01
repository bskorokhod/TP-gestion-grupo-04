import { useEffect, useMemo, useState } from "react";

import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { Avatar } from "@/components/ui/Avatar.tsx";
import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { useMyMember } from "@/hooks/useMyMember.ts";
import { useToast } from "@/hooks/useToast.ts";
import type { Member } from "@/models/Group.ts";
import { useGetGroupMembers } from "@/services/GroupServices.ts";

type Reservation = {
  id: string;
  start: string;
  end: string;
  memberId: number;
  memberName: string;
  memberColor?: Member["color"];
  createdAt: string;
};
const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const STORAGE_EVENT = "esnuestro-reservations-changed";

function storageKey(groupId: number) {
  return `esnuestro:reservations:${groupId}`;
}
function readReservations(groupId: number): Reservation[] {
  try {
    const raw = window.localStorage.getItem(storageKey(groupId));
    return raw ? (JSON.parse(raw) as Reservation[]) : [];
  } catch {
    return [];
  }
}
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

export function ReservationsGroupScreen() {
  const group = useCurrentGroup();
  const myMember = useMyMember(group.id);
  const { data: members = [] } = useGetGroupMembers(group.id, "ACTIVE");
  const { toast } = useToast();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const reservations = useMemo(() => readReservations(group.id), [group.id, refresh]);
  const percentageTotal = members.reduce((total, member) => total + (member.percentage ?? 0), 0);
  const groupStopped = members.length > 0 && Math.abs(percentageTotal - 100) > 0.01;
  const firstWeekday = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );
  const rangeIsComplete = Boolean(rangeStart && rangeEnd);

  const reservationsForDate = (key: string) =>
    reservations.filter((reservation) => reservation.start <= key && key <= reservation.end);
  const onChooseDate = (key: string) => {
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

  const confirmReservation = () => {
    if (groupStopped) {
      toast({
        title: "Grupo con inconsistencia",
        description: "El grupo está stoppeado por una inconsistencia de porcentajes a resolver.",
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
    if (reservations.some((reservation) => overlaps(start, end, reservation.start, reservation.end))) {
      toast({
        title: "Fechas no disponibles",
        description: "Otro miembro ya reservó parte de ese rango.",
        variant: "destructive",
      });
      setRefresh((value) => value + 1);
      return;
    }
    const reservation: Reservation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      start,
      end,
      memberId: myMember?.id ?? 0,
      memberName: myMember?.nickname || myMember?.username || "Miembro del grupo",
      memberColor: myMember?.color,
      createdAt: new Date().toISOString(),
    };
    const updated = [...reservations, reservation];
    window.localStorage.setItem(storageKey(group.id), JSON.stringify(updated));
    window.dispatchEvent(new Event(STORAGE_EVENT));
    setRefresh((value) => value + 1);
    setRangeStart(null);
    setRangeEnd(null);
    toast({
      title: "Reserva confirmada",
      description: `${formatDate(start)} al ${formatDate(end)} · ${reservation.memberName}`,
    });
  };

  const navigateMonth = (amount: number) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  // Revisa escrituras hechas por otra pestaña o por otro componente del mismo grupo.
  useEffect(() => {
    const update = () => setRefresh((value) => value + 1);
    window.addEventListener("storage", update);
    window.addEventListener(STORAGE_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(STORAGE_EVENT, update);
    };
  }, []);

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
                className="grid size-8 place-items-center rounded-full border border-brand/30 text-brand hover:bg-brand/10"
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
                className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Reservar
              </button>
            </div>
          </div>

          {groupStopped && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-group-danger/20 bg-group-danger-soft px-4 py-3 text-sm text-group-danger"
            >
              El grupo está stoppeado por una inconsistencia de porcentajes. Resolvé los porcentajes antes de reservar.
            </div>
          )}
          <p className="mb-3 text-sm text-group-muted">
            {rangeStart
              ? rangeEnd
                ? `Rango seleccionado: ${formatDate(rangeStart)} al ${formatDate(rangeEnd)}`
                : `Inicio: ${formatDate(rangeStart)} · elegí la fecha de fin`
              : "Seleccioná una fecha de inicio y otra de fin."}
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
              const color = booking ? memberColorClass(booking.memberColor) : "";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChooseDate(key)}
                  aria-label={`${day} ${visibleMonth.toLocaleDateString("es-AR", { month: "long" })}${booking ? `, reservado por ${booking.memberName}, ${formatDate(booking.start)} al ${formatDate(booking.end)}` : ", disponible"}`}
                  aria-pressed={isStart || isEnd || Boolean(selected)}
                  className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl px-1 py-2 text-xs transition hover:ring-2 hover:ring-brand/40 sm:min-h-16 ${booking ? `${color} text-white` : "bg-panel text-foreground shadow-sm"} ${inRange || isStart || isEnd ? "ring-2 ring-brand" : ""} ${selected ? "outline outline-2 outline-offset-2 outline-brand" : ""}`}
                >
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
            <button type="button" onClick={() => setSelectedReservation(null)} className="text-xs text-brand underline">
              Cerrar detalle de reserva
            </button>
          )}
        </aside>
      </section>
    </CommonLayout>
  );
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
