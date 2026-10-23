import { type ReactElement } from "react";

import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import {EmptyState} from "@/components/Expenses/ExpensesCard.tsx";
import {SECTIONS} from "@/constants/votes.ts";
import {VoteCard} from "@/components/Votes/VoteCard.tsx";
import {Vote} from "@/models/Vote.ts";
import {useGetVotes} from "@/services/VoteServices.ts";

function newestFirst(votes: readonly Vote[]): Vote[] {
    return [...votes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface ActiveVotesViewProps {
    readonly groupId?: number;
}

export const ActiveVotesView = ({ groupId }: ActiveVotesViewProps): ReactElement => {
    const { data: votes = [], isLoading } = useGetVotes(groupId);

    return (
        <section className="space-y-8 px-5 py-8 sm:px-8 lg:px-30 flex-1">
            {SECTIONS.map((section) => {
                const sectionVotes = newestFirst(votes.filter((vote) => vote.type === section.type));

                return (
                    <div key={section.type} className="space-y-4">
                        <SectionBanner title={section.title} description={section.description} variant="allDebt" />

                        {isLoading || groupId == null ? (
                            <EmptyState message="Cargando votaciones…" />
                        ) : sectionVotes.length === 0 ? (
                            <EmptyState message={section.emptyMessage} />
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {sectionVotes.map((vote) => (
                                    <VoteCard key={vote.id} vote={vote} groupId={groupId} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </section>
    );
};
