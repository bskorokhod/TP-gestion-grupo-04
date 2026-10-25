import {useState} from "react";
import {useParams} from "wouter";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import {GroupStoppedBanner} from "@/components/GroupStoppedBanner.tsx";
import {ViewToggle} from "@/components/ViewToggle.tsx";
import {PerPersonView} from "@/components/Expenses/PerPersonView.tsx";
import {PerExpenseView} from "@/components/Expenses/PerExpenseView.tsx";
import {useGetGroupByCode} from "@/services/GroupServices.ts";
import {useGetGroupSummary} from "@/services/ExpenseServices.ts";
import {formatCurrency} from "@/lib/format.ts";
import {SettledExpensesHistory} from "@/components/Expenses/SettledExpensesHistory.tsx";


export const ExpensesGroupScreen = () => {
    const {code} = useParams<{ code: string }>();
    const [personView, setPersonView] = useState(false);

    const {data: group} = useGetGroupByCode(code ?? "");
    const {data: summary} = useGetGroupSummary(group?.id);

    const owes = summary?.owes ?? 0;
    const owed = summary?.owed ?? 0;
    const pendingCount = summary?.pendingExpenses ?? 0;

    return (
        <CommonLayout className="min-h-screen bg-background font-poppins text-foreground flex flex-col">
            <GroupNavbar>
                <div
                    className="grid grid-cols-3 divide-x divide-brand/20 rounded-full bg-panel px-6 py-4 text-foreground shadow-panel sm:px-8">
                    <div className="pr-5">
                        <strong className="block text-xl font-black text-group-danger sm:text-2xl">
                            {formatCurrency(owes)}
                        </strong>
                        <span className="text-xs font-medium uppercase text-brand"> Debés </span>
                    </div>
                    <div className="px-5">
                        <strong className="block text-xl font-black text-group-green sm:text-2xl">
                            {formatCurrency(owed)}
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

            <ViewToggle
                leftLabel="Vista por gasto"
                rightLabel="Vista por persona"
                rightActive={personView}
                onToggle={() => setPersonView((value) => !value)}
            />

            <GroupStoppedBanner className="mx-5 mt-6 sm:mx-8 lg:mx-30"/>

            {group?.id != null
                ? personView
                    ? <PerPersonView groupId={group.id}/>
                    : <PerExpenseView groupId={group.id}/>
                : null}

            {group?.id != null && <SettledExpensesHistory groupId={group?.id}/>}

        </CommonLayout>
    );
};