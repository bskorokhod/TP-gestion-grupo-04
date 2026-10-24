import { type ReactElement, useState } from "react";

import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import {EmptyState} from "@/components/Expenses/ExpensesCard.tsx";
import {Pagination} from "@/components/Pagination.tsx";
import {SECTIONS, VOTES_PAGE_SIZE, type VoteSection} from "@/constants/votes.ts";
import {useGetFinishedVotes} from "@/services/VoteServices.ts";
import {FinishedVoteCard} from "@/components/Votes/FinishedVoteCard.tsx";

interface HistorialVotesSectionProps {
    readonly section: VoteSection;
    readonly groupId?: number;
}

/** Una sección del historial, con el paginado del backend (`/votes/history?type=...&page=...&size=...`). */
const HistorialVotesSection = ({ section, groupId }: HistorialVotesSectionProps): ReactElement => {
    const [page, setPage] = useState(1);
    // La API pagina desde 0; el paginador, desde 1.
    const { data, isLoading } = useGetFinishedVotes(groupId, section.type, page - 1, VOTES_PAGE_SIZE);

    const votes = data?.items ?? [];
    const totalPages = Math.max(1, data?.totalPages ?? 1);

    return (
        <div className="space-y-4">
            <SectionBanner title={section.title} description={section.description} variant="allDebt" />

            {isLoading || groupId == null ? (
                <EmptyState message="Cargando votaciones…" />
            ) : votes.length === 0 ? (
                <EmptyState message={section.emptyMessage} />
            ) : (
                <>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {votes.map((vote) => (
                            <FinishedVoteCard key={vote.id} vote={vote} />
                        ))}
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="pt-2" />
                </>
            )}
        </div>
    );
};

export interface HistorialVotesViewProps {
    readonly groupId?: number;
}

export const HistorialVotesView = ({ groupId }: HistorialVotesViewProps): ReactElement => (
    <section className="space-y-8 px-5 py-8 sm:px-8 lg:px-30 flex-1">
        {SECTIONS.map((section) => (
            <HistorialVotesSection key={section.type} section={section} groupId={groupId} />
        ))}
    </section>
);
