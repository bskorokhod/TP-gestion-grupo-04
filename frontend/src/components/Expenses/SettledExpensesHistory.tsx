import {useState} from "react";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import {ExpenseHistoryPanel} from "@/components/Expenses/ExpenseHistory.tsx";

interface SettledExpensesHistoryProps {
    readonly groupId: number;
    readonly initiallyOpen?: boolean;
}

export function SettledExpensesHistory({groupId, initiallyOpen = false}: SettledExpensesHistoryProps) {
    const [isOpen, setIsOpen] = useState(initiallyOpen);

    return (
        <section className="space-y-4 flex-1">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-4 rounded-full bg-warm-muted px-6 py-3 text-left text-white shadow-sm transition-colors hover:bg-[#6c6a62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:px-8 sm:py-4"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((value) => !value)}
            >
                <span>
                    <span className="block text-lg font-bold sm:text-xl">Gastos saldados</span>
                    <span className="block text-xs leading-tight text-white/80 sm:text-sm">Estos son los gastos que ya pagaste por completo.</span>
                </span>
                <FontAwesomeIcon icon={faChevronDown} className={`size-4 transition-transform sm:size-5 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <div className={isOpen ? undefined : "hidden"}>
                <ExpenseHistoryPanel groupId={groupId} source="MINE" />
            </div>
        </section>
    );
}
