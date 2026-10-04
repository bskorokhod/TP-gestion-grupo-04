import { ReservationDetail } from "@/components/Reservations/ReservationDetail.tsx";
import { Avatar } from "@/components/ui/Avatar.tsx";
import { formatDate } from "@/lib/dates.ts";
import type { ReservationsCalendarState } from "@/hooks/useReservationsCalendar.ts";

const ACTIVITY_LIMIT = 6;

export function ReservationsSidebar({ calendar }: { readonly calendar: ReservationsCalendarState }) {
    const { reservations, members, selected, pendingReasons, myMemberId, limit, visibleMonth } = calendar;
    const monthName = visibleMonth.toLocaleDateString("es-AR", { month: "long" });
    const recent = [...reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, ACTIVITY_LIMIT);

    return (
        <aside className="space-y-7">
            <p className="rounded-xl bg-panel px-4 py-3 text-xs text-group-muted">
                Tu límite para <strong>{monthName}</strong> es de <strong>{limit.total} días</strong>. Ya tenés{" "}
                <strong>{limit.booked} reservados</strong> y te quedan <strong>{limit.remaining} disponibles</strong>
                {limit.ownershipPercentage !== undefined ? ` según tu ${limit.ownershipPercentage}% de propiedad.` : "."}
            </p>

            <section>
                <h3 className="mb-4 text-base font-bold text-group-heading">Actividad</h3>
                {recent.length === 0 ? (
                    <p className="text-sm text-group-muted">Todavía no hay reservas. Todas las fechas están disponibles.</p>
                ) : (
                    <ul className="space-y-4">
                        {recent.map((reservation) => (
                            <li key={reservation.id} className="flex gap-3">
                                <Avatar name={reservation.memberNickname} color={reservation.memberColor} size="sm" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-group-heading">{reservation.memberNickname}</p>
                                    <p className="text-xs text-group-muted">
                                        {formatDate(reservation.startDate)} al {formatDate(reservation.endDate)}
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

            {selected && (
                <ReservationDetail
                    key={selected.id}
                    reservation={selected}
                    isOwn={selected.memberId === myMemberId}
                    pendingReason={pendingReasons.get(selected.id)}
                    onCancelOwn={calendar.cancelOwn}
                    onRequestCancellation={calendar.requestCancellation}
                    onClose={calendar.closeDetail}
                />
            )}
        </aside>
    );
}
