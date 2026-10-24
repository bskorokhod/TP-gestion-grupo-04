import { useParams } from "wouter";

import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { GroupStoppedBanner } from "@/components/GroupStoppedBanner.tsx";
import { useGetGroupByCode } from "@/services/GroupServices.ts";
import { useGetFinishedVotesSummary, useGetVotes } from "@/services/VoteServices.ts";
import { ViewToggle } from "@/components/ViewToggle.tsx";
import { useState } from "react";
import { ActiveVotesView } from "@/components/Votes/ActiveVotesView.tsx";
import { HistorialVotesView } from "@/components/Votes/HistorialVotesView.tsx";

const HISTORY_DESCRIPTION = "Votaciones finalizadas: revisá el resultado de cada propuesta.";

interface PillStat {
    readonly value: number;
    readonly label: string;
    readonly valueClassName: string;
}

/** Píldora del navbar con dos métricas separadas por una línea. */
const StatsPill = ({stats}: { readonly stats: readonly [PillStat, PillStat] }) => (
    <div
        className="grid grid-cols-2 divide-x divide-brand/20 rounded-full bg-panel px-6 py-4 text-foreground shadow-panel sm:px-8">
        {stats.map((stat, index) => (
            <div key={stat.label} className={index === 0 ? "pr-5" : "pl-5"}>
                <strong className={`block text-xl font-black sm:text-2xl ${stat.valueClassName}`}>{stat.value}</strong>
                <span className="text-xs font-medium uppercase text-brand"> {stat.label} </span>
            </div>
        ))}
    </div>
);

export const VotesGroupScreen = () => {
    const {code} = useParams<{ code: string }>();
    const [showHistory, setShowHistory] = useState(false);

    const {data: group} = useGetGroupByCode(code ?? "");
    const {data: actives = []} = useGetVotes(group?.id);
    const {data: summary} = useGetFinishedVotesSummary(group?.id, showHistory);

    const awaitingMyVote = actives.filter((vote) => vote.canVote && vote.myChoice == null).length;

    const stats: readonly [PillStat, PillStat] = showHistory
        ? [
            {value: summary?.approved ?? 0, label: "Votaciones aprobadas", valueClassName: "text-brand"},
            {value: summary?.rejected ?? 0, label: "Rechazadas", valueClassName: "text-group-danger"},
        ]
        : [
            {value: actives.length, label: "Votaciones activas", valueClassName: "text-brand"},
            {value: awaitingMyVote, label: "Esperan tu voto", valueClassName: "text-group-green"},
        ];

    return (
        <CommonLayout className="min-h-screen bg-background font-poppins text-foreground flex flex-col">
            <GroupNavbar description={showHistory ? HISTORY_DESCRIPTION : undefined}>
                <StatsPill stats={stats}/>
            </GroupNavbar>

            <ViewToggle
                leftLabel="Activas"
                rightLabel="Historial"
                rightActive={showHistory}
                onToggle={() => setShowHistory((value) => !value)}
            />

            <GroupStoppedBanner className="mx-5 mt-6 sm:mx-8 lg:mx-30"/>

            {group?.id != null
                ? showHistory
                    ? <HistorialVotesView groupId={group.id}/>
                    : <ActiveVotesView groupId={group.id}/>
                : null}

        </CommonLayout>
    );
};
