import { useState } from "react";
import { useParams } from "wouter";

import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { PerPersonView } from "@/components/Expenses/PerPersonView.tsx";
import { PerExpenseView } from "@/components/Expenses/PerExpenseView.tsx";

import { useGetGroupByCode } from "@/services/GroupServices.ts";
import { useGetGroupSummary } from "@/services/ExpenseServices.ts";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const ExpensesGroupScreen = () => {
  const { code } = useParams<{ code: string }>();
  const [personView, setPersonView] = useState(false);

  const { data: group } = useGetGroupByCode(code ?? "");
  const { data: summary } = useGetGroupSummary(group?.id);

  const owes = summary?.owes ?? 0;
  const owed = summary?.owed ?? 0;
  const pendingCount = summary?.pendingExpenses ?? 0;

  return (
      <CommonLayout className="min-h-screen bg-background font-poppins text-foreground flex flex-col">
        <GroupNavbar>
          <div className="grid grid-cols-3 divide-x divide-brand/20 rounded-full bg-panel px-6 py-4 text-foreground shadow-panel sm:px-8">
            <div className="pr-5">
              <strong className="block text-xl font-black text-group-danger sm:text-2xl">
                {currencyFormatter.format(owes)}
              </strong>
              <span className="text-xs font-medium uppercase text-brand"> Debés </span>
            </div>
            <div className="px-5">
              <strong className="block text-xl font-black text-group-green sm:text-2xl">
                {currencyFormatter.format(owed)}
              </strong>
              <span className="text-xs font-medium uppercase text-brand"> Te deben </span>
            </div>
            <div className="pl-5">
              <strong className="block text-xl font-black text-brand sm:text-2xl">
                {pendingCount}
              </strong>
              <span className="text-xs font-medium uppercase text-brand"> Gastos propuestos </span>
            </div>
          </div>
        </GroupNavbar>

        <div className=" flex justify-end">
          <button
              onClick={() => setPersonView((value) => !value)}
              className="flex items-center gap-3 rounded-b-3xl bg-brand px-6 py-3 text-base text-brand-foreground"
              aria-pressed={personView}
          >
            Vista por gasto
            <span
                className={`flex h-6 w-12 items-center rounded-full bg-panel p-1 ${
                    personView ? "justify-end" : "justify-start"
                }`}
            >
            <span className="size-4 rounded-full bg-group-green" />
          </span>
            Vista por persona
          </button>
        </div>

        {group?.id != null
            ? personView
                ? <PerPersonView groupId={group.id} />
                : <PerExpenseView groupId={group.id} />
            : null}

      </CommonLayout>
  );
};