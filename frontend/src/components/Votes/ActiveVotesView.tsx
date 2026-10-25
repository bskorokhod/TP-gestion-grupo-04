import { type ReactElement, useState } from "react";

import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import {EmptyState} from "@/components/Expenses/ExpensesCard.tsx";
import {Pagination} from "@/components/Pagination.tsx";
import {SECTIONS, VOTES_PAGE_SIZE, type VoteSection} from "@/constants/votes.ts";
import {VoteCard} from "@/components/Votes/VoteCard.tsx";
import {Vote} from "@/models/Vote.ts";
import {useGetVotes} from "@/services/VoteServices.ts";

function newestFirst(votes: readonly Vote[]): Vote[] {
    return [...votes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

interface ActiveVotesSectionProps {
    readonly section: VoteSection;
    readonly votes: readonly Vote[];
    readonly isLoading: boolean;
    readonly groupId?: number;
}

/** Una sección de votaciones activas, paginada en el front (el backend devuelve todas las activas juntas). */
const ActiveVotesSection = ({ section, votes, isLoading, groupId }: ActiveVotesSectionProps): ReactElement => {
    const [page, setPage] = useState(1);

    const sectionVotes = newestFirst(votes.filter((vote) => vote.type === section.type));
    const totalPages = Math.max(1, Math.ceil(sectionVotes.length / VOTES_PAGE_SIZE));
    // Si al finalizar votaciones la página actual deja de existir, se muestra la última.
    const currentPage = Math.min(page, totalPages);
    const pageVotes = sectionVotes.slice((currentPage - 1) * VOTES_PAGE_SIZE, currentPage * VOTES_PAGE_SIZE);

    return (
        <div className="space-y-4 scroll-mt-6" data-vote-section={section.type}>
            <SectionBanner title={section.title} description={section.description} variant="allDebt" />

            {isLoading || groupId == null ? (
                <EmptyState message="Cargando votaciones…" />
            ) : sectionVotes.length === 0 ? (
                <EmptyState message={section.emptyMessage} />
            ) : (
                <>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {pageVotes.map((vote) => (
                            <VoteCard key={vote.id} vote={vote} groupId={groupId} />
                        ))}
                    </div>
                    <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="pt-2" />
                </>
            )}
        </div>
    );
};

export interface ActiveVotesViewProps {
    readonly groupId?: number;
}

export const ActiveVotesView = ({ groupId }: ActiveVotesViewProps): ReactElement => {
    const { data: votes = [], isLoading } = useGetVotes(groupId);

    return (
        <section className="space-y-8 px-5 py-8 sm:px-8 lg:px-30 flex-1">
            {SECTIONS.map((section) => (
                <ActiveVotesSection
                    key={section.type}
                    section={section}
                    votes={votes}
                    isLoading={isLoading}
                    groupId={groupId}
                />
            ))}
        </section>
    );
};
