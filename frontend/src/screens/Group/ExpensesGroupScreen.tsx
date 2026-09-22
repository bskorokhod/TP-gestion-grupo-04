import { useState } from "react";
import { useParams } from "wouter";

// import Button from "@/components/Button.tsx"
import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
// import { ProposalCard } from "@/components/Expenses/ExpensesCard.tsx";
import { PerPersonView } from "@/components/Expenses/PerPersonView.tsx";
import { PerExpenseView } from "@/components/Expenses/PerExpenseView.tsx";

import { useGetGroupByCode } from "@/services/GroupServices.ts";
import { useGetExpenses } from "@/services/ExpenseServices.ts";

export const ExpensesGroupScreen = () => {
  // Extraemos el parámetro "code" utilizando wouter[cite: 16]
  const { code } = useParams<{ code: string }>();
  const [personView, setPersonView] = useState(false);

  // 1. Obtenemos el grupo numérico en base al código de la URL. Al estar cacheado por GroupGuard, esto es instantáneo.
  const { data: group } = useGetGroupByCode(code ?? "");

  // 2. Buscamos los gastos utilizando el ID numérico, esto no se ejecuta si group.id es undefined.
  const { data: expenses } = useGetExpenses(group?.id);

  // Filtramos solo los gastos pendientes
  const pendingExpenses = expenses?.filter(expense => expense.status === "PENDING") || [];

  return (
    <CommonLayout className="min-h-screen bg-background font-poppins text-foreground">
      <GroupNavbar>
        <div className="grid grid-cols-3 divide-x divide-brand/20 rounded-full bg-panel px-6 py-4 text-foreground shadow-panel sm:px-8">
          <div className="pr-5">
            <strong className="block text-xl font-black text-group-danger sm:text-2xl">
              $11.500 {/* Próximamente se calculará a partir de las deudas */}
            </strong>
            <span className="text-xs font-medium uppercase text-brand"> Debés </span>
          </div>
          <div className="px-5">
            <strong className="block text-xl font-black text-group-green sm:text-2xl">
              $25.000 {/* Próximamente se calculará a partir de las deudas */}
            </strong>
            <span className="text-xs font-medium uppercase text-brand"> Te deben </span>
          </div>
          <div className="pl-5">
            <strong className="block text-xl font-black text-brand sm:text-2xl">
              {pendingExpenses.length}
            </strong>
            <span className="text-xs font-medium uppercase text-brand"> Gastos propuestos </span>
          </div>
        </div>
      </GroupNavbar>

      <div className="mx-auto flex justify-end">
        <button onClick={() => setPersonView((value) => !value)} className="flex items-center gap-3 rounded-b-3xl bg-brand px-6 py-3 text-base text-brand-foreground" aria-pressed={personView}>
          Vista por gasto
          <span className={`flex h-6 w-12 items-center rounded-full bg-panel p-1 ${personView ? "justify-end" : "justify-start"}`}>
              <span className="size-4 rounded-full bg-group-green" />
            </span>
          Vista por persona
        </button>
      </div>

      {personView ? <PerPersonView groupId={group?.id}/> : <PerExpenseView groupId={group?.id}/>}

      {/*<section aria-label="Gastos propuestos">*/}
      {/*  <div className="bg-amber-soft h-16">*/}
      {/*    <div className="bg-background h-16 rounded-b-full"></div>*/}
      {/*  </div>*/}

        {/*<div className="bg-group-amber-soft px-5 py-10 sm:px-8 lg:px-30">*/}
        {/*  <div className="mx-auto space-y-5">*/}
        {/*    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-brand-foreground">*/}
        {/*      <div className="min-w-0">*/}
        {/*        <h2 className="text-xl font-bold">Gastos propuestos</h2>*/}
        {/*        <p className="text-base">Pendientes de aprobación</p>*/}
        {/*      </div>*/}
        {/*      <Button variant="proposal" className="shrink-0 text-lg p-6">Proponer gasto</Button>*/}
        {/*    </div>*/}
        {/*    <div className="grid gap-4 lg:grid-cols-2">*/}
        {/*      {isLoadingExpenses ? (*/}
        {/*        <p className="text-brand-foreground col-span-full">Cargando propuestas...</p>*/}
        {/*      ) : pendingExpenses.length === 0 ? (*/}
        {/*        <p className="text-brand-foreground col-span-full">No hay gastos pendientes en este momento.</p>*/}
        {/*      ) : (*/}
        {/*        pendingExpenses.map((expense) => (*/}
        {/*          <ProposalCard*/}
        {/*            key={expense.id}*/}
        {/*            title={expense.details.description}*/}
        {/*            amount={`Total: $${expense.details.totalAmount}`}*/}
        {/*            description={expense.details.description}*/}
        {/*            assigned={expense.details.participants.map(p => p.member.nickname)}*/}
        {/*            owner={expense.creator.nickname}*/}
        {/*            status={expense.status.toLowerCase()}*/}
        {/*          />*/}
        {/*        ))*/}
        {/*      )}*/}
        {/*    </div>*/}
        {/*  </div>*/}
      {/*  </div>*/}
      {/*</section>*/}
    </CommonLayout>
  );
}