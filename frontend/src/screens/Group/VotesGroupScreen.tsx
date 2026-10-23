import { useParams } from "wouter";

import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { GroupStoppedBanner } from "@/components/GroupStoppedBanner.tsx";
import { useGetGroupByCode } from "@/services/GroupServices.ts";
import { useGetVotes } from "@/services/VoteServices.ts";
import {ViewToggle} from "@/components/ViewToggle.tsx";
import {useState} from "react";
import {ActiveVotesView} from "@/components/Votes/ActiveVotesView.tsx";
import {HistorialVotesView} from "@/components/Votes/HistorialVotesView.tsx";


/** Más nuevas primero (las fechas ISO se ordenan como texto). */

export const VotesGroupScreen = () => {
  const { code } = useParams<{ code: string }>();
  const [activeVotesView, setActiveView] = useState(false);

  const {data: group} = useGetGroupByCode(code ?? "");
  const { data: votes = [] } = useGetVotes(group?.id);

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

      <ViewToggle
          leftLabel="Activas"
          rightLabel="Historial"
          rightActive={activeVotesView}
          onToggle={() => setActiveView((value) => !value)}
      />

      <GroupStoppedBanner className="mx-5 mt-6 sm:mx-8 lg:mx-30"/>

      {group?.id != null
          ? activeVotesView
              ? <HistorialVotesView groupId={group.id}/>
              : <ActiveVotesView groupId={group.id} />
          : null}

    </CommonLayout>
  );
};
