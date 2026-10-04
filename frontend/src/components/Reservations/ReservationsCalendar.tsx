import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/Button.tsx";
import { GroupStoppedBanner } from "@/components/GroupStoppedBanner.tsx";
import type { ReservationsCalendarState } from "@/hooks/useReservationsCalendar.ts";
import { cn } from "@/lib/cn.ts";
import { memberColorClass } from "@/lib/colors.ts";
import { dateKey, daysInMonth, formatDate, monthStart } from "@/lib/dates.ts";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const NAV_BUTTON = "rounded-full border-brand/30 text-brand hover:bg-brand/10 hover:text-brand";

export function ReservationsCalendar({ calendar }: { readonly calendar: ReservationsCalendarState }) {
    const { visibleMonth, range, selected, members, groupStopped, firstBookableDate, reservationOn } = calendar;
    const monthName = visibleMonth.toLocaleDateString("es-AR", { month: "long" });
    const firstWeekday = (monthStart(visibleMonth).getDay() + 6) % 7;
    const cells = Array.from({ length: firstWeekday + daysInMonth(visibleMonth) }, (_, index) =>
        index < firstWeekday ? null : index - firstWeekday + 1,
    );

    const rangeText = !range.start
        ? "Seleccioná una fecha de inicio y otra de fin."
        : range.end
          ? `Rango seleccionado: ${formatDate(range.start)} al ${formatDate(range.end)}`
          : `Inicio: ${formatDate(range.start)} · elegí la fecha de fin`;

    const legend = [
        ...members.slice(0, 4).map((member) => ({ dot: memberColorClass(member.color), label: member.nickname })),
        { dot: "bg-panel ring-1 ring-black/10", label: "Disponible" },
        { dot: "bg-background ring-1 ring-black/10", label: "No disponible para reservar" },
    ];

    return (
        <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold capitalize text-group-heading">
                    {monthName} <span className="font-normal text-group-muted">{visibleMonth.getFullYear()}</span>
                </h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className={NAV_BUTTON}
                        aria-label="Mes anterior"
                        disabled={!calendar.canGoBack}
                        onClick={() => calendar.navigateMonth(-1)}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" aria-hidden />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className={NAV_BUTTON}
                        aria-label="Mes siguiente"
                        onClick={() => calendar.navigateMonth(1)}
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" aria-hidden />
                    </Button>
                </div>
            </div>

            <GroupStoppedBanner className="mb-4" />
            {calendar.isLoading && <p className="mb-3 text-sm text-group-muted">Cargando reservas...</p>}
            {calendar.isError && (
                <p role="alert" className="mb-3 rounded-xl bg-group-danger-soft px-4 py-3 text-sm text-group-danger">
                    No se pudieron cargar las reservas. Intentá actualizar la página.
                </p>
            )}
            <p className="mb-3 text-sm text-group-muted">{rangeText}</p>

            <div className="grid grid-cols-7 gap-2 text-center">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="pb-1 text-[10px] font-semibold uppercase text-group-muted">
                        {day}
                    </div>
                ))}
                {cells.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} aria-hidden className="min-h-14 sm:min-h-[4.5rem]" />;

                    const key = dateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
                    const booking = reservationOn(key);
                    const unavailable = key < firstBookableDate;
                    const disabled = unavailable || (groupStopped && !booking);
                    const isEdge = key === range.start || key === range.end;
                    const inRange = Boolean(range.start && range.end && key >= range.start && key <= range.end);
                    const isSelected = booking !== undefined && booking.id === selected?.id;
                    const tone = booking
                        ? `${memberColorClass(booking.memberColor)} text-foreground`
                        : disabled
                          ? "bg-background text-group-muted/50"
                          : "bg-panel text-foreground shadow-sm";

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => calendar.chooseDate(key)}
                            disabled={disabled}
                            aria-label={`${day} ${monthName}${booking ? `, reservado por ${booking.memberNickname}, ${formatDate(booking.startDate)} al ${formatDate(booking.endDate)}` : ", disponible"}`}
                            aria-pressed={isEdge || isSelected}
                            className={cn(
                                "relative flex min-h-14 flex-col items-center justify-center overflow-hidden rounded-xl px-1 py-2 text-xs transition sm:min-h-[4.5rem]",
                                disabled ? "cursor-not-allowed" : "hover:ring-2 hover:ring-brand/40",
                                tone,
                                unavailable && "border border-group-muted/60",
                                (inRange || isEdge) && "ring-2 ring-brand",
                                isSelected && "outline outline-2 outline-offset-2 outline-brand",
                            )}
                        >
                            {unavailable && (
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-[-12%] top-1/2 h-px w-[124%] rotate-[-25deg] bg-group-muted/60"
                                />
                            )}
                            <span>{day}</span>
                            {booking && (
                                <span className="mt-0.5 max-w-full truncate text-[9px] opacity-90">{booking.memberNickname}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-group-muted">
                {legend.map(({ dot, label }) => (
                    <span key={`${dot}-${label}`} className="flex items-center gap-1.5">
                        <i className={cn("size-2 rounded-full", dot)} />
                        {label}
                    </span>
                ))}
            </div>

            {range.start && range.end && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-panel p-4 shadow-group">
                    <p className="text-sm">
                        Reservar del <strong>{formatDate(range.start)}</strong> al <strong>{formatDate(range.end)}</strong>
                    </p>
                    <Button className="rounded-full" disabled={groupStopped} onClick={calendar.confirm}>
                        Confirmar reserva
                    </Button>
                </div>
            )}
        </div>
    );
}
