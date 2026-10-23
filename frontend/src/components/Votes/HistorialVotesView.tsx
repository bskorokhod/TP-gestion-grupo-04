import { type ReactElement } from "react";

import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import {EmptyState} from "@/components/Expenses/ExpensesCard.tsx";
import {SECTIONS} from "@/constants/votes.ts";
import {FinishedVote} from "@/models/Vote.ts";
import {useGetFinishedVotes} from "@/services/VoteServices.ts";
import {FinishedVoteCard} from "@/components/Votes/FinishedVoteCard.tsx";


export interface HistorialVotesViewProps {
    readonly groupId?: number;
}


export const HistorialVotesView = ({ groupId }: HistorialVotesViewProps): ReactElement => {
    const { data : data , isLoading } = useGetFinishedVotes(groupId);
    const votes : FinishedVote[] = data?.items || [];

    return (
        <section className="space-y-8 px-5 py-8 sm:px-8 lg:px-30 flex-1">
            {SECTIONS.map((section) => {
                const sectionVotes = votes.filter((vote) => vote.type === section.type);

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
                                <FinishedVoteCard key={vote.id} vote={vote} />
                            ))}
                        </div>
                )}
                    </div>
                );
                })}
            </section>
    );
};
