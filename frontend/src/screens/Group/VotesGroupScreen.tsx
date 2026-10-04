import { useParams } from "wouter";

import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { EmptyState } from "@/components/Expenses/ExpensesCard.tsx";
import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { GroupStoppedBanner } from "@/components/GroupStoppedBanner.tsx";
import { VoteCard } from "@/components/Votes/VoteCard.tsx";
import type { Vote, VoteType } from "@/models/Vote.ts";
import { useGetGroupByCode } from "@/services/GroupServices.ts";
import { useGetVotes } from "@/services/VoteServices.ts";

interface VoteSectionConfig {
  readonly type: VoteType;
  readonly title: string;
  readonly description: string;
  readonly emptyMessage: string;
}

const SECTIONS: readonly VoteSectionConfig[] = [
  {
    type: "EXTRAORDINARY_EXPENSE",
    title: "Gastos extraordinarios",
    description: "Gastos que alcanzan el umbral del grupo y se registran solo si se aprueban.",
    emptyMessage: "No hay gastos extraordinarios en votación.",
  },
  {
    type: "EXPENSE_REPORT",
    title: "Reportes de gasto",
    description: "Pedidos para modificar o eliminar gastos ya registrados.",
    emptyMessage: "No hay reportes de gasto en votación.",
  },
  {
    type: "RESERVATION_CLAIM",
    title: "Reclamos de reservas",
    description: "Pedidos para cancelar la reserva de otro miembro.",
    emptyMessage: "No hay reclamos de reservas en votación.",
  },
  {
    type: "CONFIG_CHANGE",
    title: "Cambios de configuración",
    description: "Cambios en los ajustes del grupo. Requieren la aprobación unánime de los miembros.",
    emptyMessage: "No hay cambios de configuración en votación.",
  },
];

/** Más nuevas primero (las fechas ISO se ordenan como texto). */
function newestFirst(votes: readonly Vote[]): Vote[] {
  return [...votes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const VotesGroupScreen = () => {
  const { code } = useParams<{ code: string }>();

  const { data: group } = useGetGroupByCode(code ?? "");
  const { data: votes = [], isLoading } = useGetVotes(group?.id);

  const awaitingMyVote = votes.filter((vote) => vote.canVote && vote.myChoice == null).length;

  return (
    <CommonLayout className="min-h-screen bg-background font-poppins text-foreground flex flex-col">
      <GroupNavbar>
        <div className="grid grid-cols-2 divide-x divide-brand/20 rounded-full bg-panel px-6 py-4 text-foreground shadow-panel sm:px-8">
          <div className="pr-5">
            <strong className="block text-xl font-black text-brand sm:text-2xl">{votes.length}</strong>
            <span className="text-xs font-medium uppercase text-brand"> Votaciones activas </span>
          </div>
          <div className="pl-5">
            <strong className="block text-xl font-black text-group-green sm:text-2xl">{awaitingMyVote}</strong>
            <span className="text-xs font-medium uppercase text-brand"> Esperan tu voto </span>
          </div>
        </div>
      </GroupNavbar>

      <section className="space-y-8 px-5 py-8 sm:px-8 lg:px-30">
        <GroupStoppedBanner />
        {SECTIONS.map((section) => {
          const sectionVotes = newestFirst(votes.filter((vote) => vote.type === section.type));

          return (
            <div key={section.type} className="space-y-4">
              <SectionBanner title={section.title} description={section.description} variant="allDebt" />

              {isLoading || group?.id == null ? (
                <EmptyState message="Cargando votaciones…" />
              ) : sectionVotes.length === 0 ? (
                <EmptyState message={section.emptyMessage} />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {sectionVotes.map((vote) => (
                    <VoteCard key={vote.id} vote={vote} groupId={group.id} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </CommonLayout>
  );
};
