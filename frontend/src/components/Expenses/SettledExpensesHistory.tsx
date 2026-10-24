import {useMemo, useState, type ReactElement} from "react";
import {faCheck, faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import Button from "@/components/Button.tsx";
import type {SelectOption} from "@/components/Forms/SelectField.tsx";
import {Avatar} from "@/components/ui/Avatar.tsx";
import {categoryColor, categoryLabel, EXPENSE_CATEGORIES} from "@/constants/expenseCategories.ts";
import {memberColorClass} from "@/lib/colors.ts";
import {formatCurrency} from "@/lib/format.ts";
import {useGetSettledExpenses} from "@/services/BalanceServices.ts";

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const PAGE_SIZE = 6;
const VISIBLE_PAGE_BUTTONS = 5;
const ALL = "ALL";

function formatDate(iso: string): string {
    const date = new Date(iso);
    const day = String(date.getDate()).padStart(2, "0");
    return `${day} ${MONTHS_SHORT[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
}

function visiblePages(current: number, total: number): number[] {
    const length = Math.min(VISIBLE_PAGE_BUTTONS, total);
    const start = Math.max(1, Math.min(current - Math.floor(VISIBLE_PAGE_BUTTONS / 2), total - length + 1));
    return Array.from({length}, (_, index) => start + index);
}

interface HistoryFilterProps {
    readonly id: string;
    readonly label: string;
    readonly options: ReadonlyArray<SelectOption>;
    readonly value: string;
    readonly onChange: (value: string) => void;
}

function HistoryFilter({id, label, options, value, onChange}: HistoryFilterProps): ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

    return (
        <div className="relative">
            <button
                id={id}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
                className="flex min-w-36 items-center justify-between gap-3 rounded-full border border-[#dfd9cf] bg-white px-4 py-2 text-xs font-medium text-texto-principal shadow-sm transition hover:border-brand/50 hover:bg-[#fcfaf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25"
            >
                <span><span className="text-texto-principal/60">{label}:</span> {selectedLabel}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`size-3 text-texto-principal/60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
                <div
                    role="listbox"
                    aria-labelledby={id}
                    className="absolute right-0 z-20 mt-2 min-w-full overflow-hidden rounded-2xl border border-[#e4ded4] bg-white p-1.5 shadow-[0_10px_28px_rgba(63,53,37,0.18)]"
                >
                    {options.map((option) => {
                        const selected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                disabled={option.disabled}
                                onClick={() => {
                                    if (!option.disabled) {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }
                                }}
                                className={`flex w-full items-center justify-between gap-5 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs transition ${
                                    selected
                                        ? "bg-brand text-brand-foreground"
                                        : "text-texto-principal hover:bg-group-paper"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                <span>{option.label}</span>
                                {selected && <FontAwesomeIcon icon={faCheck} className="size-3" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface SettledExpensesHistoryProps {
    readonly groupId: number;
    readonly initiallyOpen?: boolean;
}

export function SettledExpensesHistory({groupId, initiallyOpen = false}: SettledExpensesHistoryProps) {
    const {data: expenses = []} = useGetSettledExpenses(groupId);
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    const [category, setCategory] = useState(ALL);
    const [creditorId, setCreditorId] = useState(ALL);
    const [page, setPage] = useState(1);

    const changeFilter = (setter: (value: string) => void) => (value: string) => {
        setter(value);
        setPage(1);
    };

    const filtered = useMemo(() => expenses.filter((expense) => {
        return (category === ALL || expense.category === category)
            && (creditorId === ALL || expense.creditor.id === Number(creditorId));
    }), [expenses, category, creditorId]);

    const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const creditorOptions: SelectOption[] = [
        {value: ALL, label: "Cualquiera"},
        ...Array.from(new Map(expenses.map(({creditor}) => [creditor.id, creditor])).values())
            .map((creditor) => ({value: String(creditor.id), label: creditor.nickname})),
    ];

    return (
        <section className="flex flex-col gap-3">
            <button
                type="button"
                className="flex min-h-14 items-center justify-between gap-4 rounded-full bg-[#77756c] px-6 py-3 text-left text-white shadow-sm transition-colors hover:bg-[#6c6a62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:min-h-16 sm:px-8 sm:py-4"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((value) => !value)}
            >
                <span>
                    <span className="block text-lg font-bold sm:text-xl">Gastos saldados</span>
                    <span className="block text-xs leading-tight text-white/80 sm:text-sm">Estos son los gastos que ya fueron pagados por completo.</span>
                </span>
                <FontAwesomeIcon icon={faChevronDown} className={`size-4 transition-transform sm:size-5 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="rounded-3xl bg-white px-5 py-5 text-texto-principal shadow-[0_8px_24px_rgba(63,53,37,0.08)] sm:px-8 sm:py-6">
                    <div className="flex min-w-[680px] items-center justify-between gap-4 pb-5">
                        <h3 className="text-base font-bold sm:text-lg">Historial de gastos saldados</h3>
                        <div className="flex items-center gap-3">
                            <HistoryFilter id={`filter-category-${groupId}`} label="Categoría" options={[{value: ALL, label: "Todas"}, ...EXPENSE_CATEGORIES.map((value) => ({value, label: categoryLabel(value)}))]} value={category} onChange={changeFilter(setCategory)} />
                            <HistoryFilter id={`filter-creditor-${groupId}`} label="A cargo de" options={creditorOptions} value={creditorId} onChange={changeFilter(setCreditorId)} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                    <div className="min-w-[680px]">
                    <div className="grid grid-cols-[75px_105px_minmax(180px,1fr)_130px_90px] items-center gap-4 border-b-2 border-[#b9b7b0] px-0 py-3 text-xs font-semibold text-texto-principal sm:grid-cols-[85px_115px_minmax(200px,1fr)_145px_100px]">
                        <p>Fecha saldado</p>
                        <p>Categoría</p>
                        <p>Nombre del gasto</p>
                        <p>A cargo de</p>
                        <p className="text-right">Monto pagado</p>
                    </div>
                    {pageItems.length === 0 && <p className="border-b border-[#eceae5] py-8 text-center text-xs text-texto-principal/60">No hay gastos saldados para mostrar.</p>}
                    {pageItems.map((expense) => (
                        <div key={expense.id} className="grid grid-cols-[75px_105px_minmax(180px,1fr)_130px_90px] items-center gap-4 border-b border-[#eceae5] px-0 py-4 text-xs sm:grid-cols-[85px_115px_minmax(200px,1fr)_145px_100px]">
                            <p className="text-[10px] text-texto-principal/55 sm:text-xs">{formatDate(expense.createdAt)}</p>
                            <span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold leading-none ${memberColorClass(categoryColor(expense.category))}`}>{categoryLabel(expense.category)}</span>
                            <p className="truncate text-xs sm:text-sm">{expense.title}</p>
                            <div className="flex min-w-0 items-center gap-1.5">
                                <Avatar name={expense.creditor.nickname} color={expense.creditor.color} photoUrl={expense.creditor.photoUrl} size="sm" />
                                <p className="truncate text-xs font-medium sm:text-sm">{expense.creditor.nickname}</p>
                            </div>
                            <p className="text-right text-xs font-semibold sm:text-sm">{formatCurrency(expense.totalAmount)}</p>
                        </div>
                    ))}
                    </div>
                    </div>
                    {totalPages > 1 && <div className="flex items-center gap-2 py-4">
                        <Button variant="page" size="icon" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</Button>
                        {visiblePages(currentPage, totalPages).map((number) => <Button key={number} variant={number === currentPage ? "success" : "page"} size="icon" onClick={() => setPage(number)}>{number}</Button>)}
                        <Button variant="page" size="icon" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>›</Button>
                    </div>}
                </div>
            )}
        </section>
    );
}
