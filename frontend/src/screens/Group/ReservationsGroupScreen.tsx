import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { ReservationsCalendar } from "@/components/Reservations/ReservationsCalendar.tsx";
import { ReservationsSidebar } from "@/components/Reservations/ReservationsSidebar.tsx";
import { useReservationsCalendar } from "@/hooks/useReservationsCalendar.ts";
import { daysBetween } from "@/lib/dates.ts";

export function ReservationsGroupScreen() {
  const calendar = useReservationsCalendar();
  const { reservations, members } = calendar;

  const stats = [
    { value: reservations.length, label: "Reservas", color: "text-brand" },
    {
      value: reservations.reduce((total, { startDate, endDate }) => total + daysBetween(startDate, endDate), 0),
      label: "Días tomados",
      color: "text-group-green",
    },
    { value: members.length, label: "Miembros", color: "text-brand" },
  ];

  return (
    <CommonLayout className="min-h-screen bg-background font-poppins text-foreground flex flex-col">
      <GroupNavbar>
        <div className="grid grid-cols-3 divide-x divide-brand/20 rounded-full bg-panel px-6 py-4 text-foreground shadow-panel sm:px-8">
          {stats.map(({ value, label, color }) => (
            <div key={label} className="px-4 first:pl-0 last:pr-0">
              <strong className={`block text-xl sm:text-2xl ${color}`}>{value}</strong>
              <span className="text-xs font-medium uppercase text-brand">{label}</span>
            </div>
          ))}
        </div>
      </GroupNavbar>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:px-10 flex-1">
        <ReservationsCalendar calendar={calendar} />
        <ReservationsSidebar calendar={calendar} />
      </section>
    </CommonLayout>
  );
}
