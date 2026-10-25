import {useEffect, useMemo, useRef, useState, type ReactElement} from "react";
import {faCheck, faChevronDown, faFileInvoiceDollar} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import Button from "@/components/Button.tsx";
import {ReceiptAction} from "@/components/Expenses/ExpensesCard.tsx";
import type {SelectOption} from "@/components/Forms/SelectField.tsx";
import {Avatar} from "@/components/ui/Avatar.tsx";
import {categoryLabel, EXPENSE_CATEGORIES} from "@/constants/expenseCategories.ts";
import {categoryBadgeClass} from "@/lib/colors.ts";
import {formatCurrency, formatDate, MONTHS_FULL} from "@/lib/format.ts";
import type {ExpenseCategory, ExpenseMember, PaymentReceipt} from "@/models/Expense.ts";
import {useGetPaidExpenses, useGetSettledExpenses} from "@/services/BalanceServices.ts";
import {useGetGroupMembers} from "@/services/GroupServices.ts";

const PAGE_SIZE = 9;
const VISIBLE_PAGE_BUTTONS = 5;
const ALL = "ALL";

/**
 * Fila del historial, igual para las dos fuentes. `date` es la fecha de creación del gasto o la del pago, y `amount` el
 * total del gasto o lo que pagué yo, según la fuente. `receiptUrl` es el comprobante de creación del gasto y `payments` los
 * comprobantes de pago: los de todos los miembros en `GROUP`, solo los propios en `MINE`.
 */
interface HistoryExpense {
    readonly id: number;
    readonly date: string;
    readonly title: string;
    readonly category: ExpenseCategory;
    readonly creditor: ExpenseMember;
    readonly amount: number;
    readonly receiptUrl?: string | null;
    readonly payments: readonly PaymentReceipt[];
}

/**
 * De dónde salen las filas:
 * - `GROUP`: los gastos saldados de todo el grupo, con su fecha de creación y su monto total.
 * - `MINE`: los gastos en los que el usuario pagó su parte por completo, con la fecha de su pago, lo que pagó y a quién.
 */
export type ExpenseHistorySource = "GROUP" | "MINE";

const SOURCE_COPY: Record<ExpenseHistorySource, {
    readonly title: string;
    readonly dateHeader: string;
    readonly amountHeader: string;
    readonly emptyMessage: string;
}> = {
    GROUP: {
        title: "Historial de gastos saldados",
        dateHeader: "Fecha creación",
        amountHeader: "Monto total",
        emptyMessage: "No hay gastos saldados para mostrar.",
    },
    MINE: {
        title: "Historial de gastos pagados",
        dateHeader: "Fecha saldado",
        amountHeader: "Monto pagado",
        emptyMessage: "No hay gastos pagados para mostrar.",
    },
};

/** Las filas de la fuente elegida; la consulta de la otra queda apagada. */
function useHistoryExpenses(groupId: number, source: ExpenseHistorySource): readonly HistoryExpense[] {
    const {data: groupExpenses} = useGetSettledExpenses(source === "GROUP" ? groupId : undefined);
    const {data: paidExpenses} = useGetPaidExpenses(source === "MINE" ? groupId : undefined);

    return useMemo(
        () => source === "GROUP"
            ? groupExpenses.map(({createdAt, totalAmount, ...expense}) => ({...expense, date: createdAt, amount: totalAmount}))
            : paidExpenses.map(({paidAt, paidAmount, ...expense}) => ({...expense, date: paidAt, amount: paidAmount})),
        [source, groupExpenses, paidExpenses],
    );
}

const HISTORY_GRID = "grid grid-cols-[7.5rem_9rem_minmax(0,1fr)_12rem_7rem_4.5rem] items-center gap-x-4 pr-6";

function visiblePages(current: number, total: number): number[] {
    const length = Math.min(VISIBLE_PAGE_BUTTONS, total);
    const start = Math.max(1, Math.min(current - Math.floor(VISIBLE_PAGE_BUTTONS / 2), total - length + 1));
    return Array.from({length}, (_, i) => start + i);
}

// ---------------------------------------------------------------------------------------------------------------------
// Filtro
// ---------------------------------------------------------------------------------------------------------------------

interface HistoryFilterProps {
    readonly id: string;
    readonly label: string;
    readonly options: ReadonlyArray<SelectOption>;
    readonly value: string;
    readonly onChange: (value: string) => void;
}

export function HistoryFilter({id, label, options, value, onChange}: HistoryFilterProps): ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

    useEffect(() => {
        if (!isOpen) return;

        const closeOnOutsideClick = (event: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("pointerdown", closeOnOutsideClick);
        return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
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

// ---------------------------------------------------------------------------------------------------------------------
// Estado: filtros, orden y paginación
// ---------------------------------------------------------------------------------------------------------------------

interface ExpenseHistoryFilters {
    /** Mes de 0 (enero) a 11, o `ALL`. */
    readonly month: string;
    readonly year: string;
    readonly category: string;
    readonly creditorId: string;
}

type FilterKey = keyof ExpenseHistoryFilters;

/**
 * Filtra, ordena (del más nuevo al más viejo) y pagina los gastos. `initial` solo fija el valor inicial de los
 * filtros; los que no se muestran quedan en `ALL` y no filtran nada.
 */
function useExpenseHistory(expenses: readonly HistoryExpense[], initial?: Partial<ExpenseHistoryFilters>) {
    const [filters, setFilters] = useState<ExpenseHistoryFilters>({
        month: ALL,
        year: ALL,
        category: ALL,
        creditorId: ALL,
        ...initial,
    });
    const [page, setPage] = useState(1);

    const setFilter = (key: FilterKey) => (value: string) => {
        setFilters((current) => ({...current, [key]: value}));
        setPage(1);
    };

    const filtered = useMemo(() => {
        return expenses
            .filter((expense) => {
                const date = new Date(expense.date);
                if (filters.year !== ALL && date.getFullYear() !== Number(filters.year)) return false;
                if (filters.month !== ALL && date.getMonth() !== Number(filters.month)) return false;
                if (filters.category !== ALL && expense.category !== filters.category) return false;
                return filters.creditorId === ALL || expense.creditor.id === Number(filters.creditorId);
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, filters]);

    const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return {filters, setFilter, pageItems, currentPage, totalPages, setPage};
}

// ---------------------------------------------------------------------------------------------------------------------
// Tabla
// ---------------------------------------------------------------------------------------------------------------------

interface ExpenseHistoryTableProps {
    readonly expenses: readonly HistoryExpense[];
    readonly dateHeader: string;
    readonly amountHeader: string;
    readonly emptyMessage: string;
    readonly page: number;
    readonly totalPages: number;
    readonly onPageChange: (page: number) => void;
}

function ExpenseHistoryTable({
    expenses,
    dateHeader,
    amountHeader,
    emptyMessage,
    page,
    totalPages,
    onPageChange,
}: ExpenseHistoryTableProps): ReactElement {
    return (
        <>
            {/* En pantallas angostas el grid conserva su ancho mínimo y se desplaza horizontalmente. */}
            <div className="overflow-x-auto">
                <div className="min-w-[58rem]">
                    <div className={`${HISTORY_GRID} whitespace-nowrap border-b border-texto-principal py-4 text-sm font-medium`}>
                        <p>{dateHeader}</p>
                        <p>Categoría</p>
                        <p>Nombre del gasto</p>
                        <p>A cargo de</p>
                        <p>{amountHeader}</p>
                        <p className="sr-only">Comprobantes</p>
                    </div>

                    {expenses.length === 0 && (
                        <p className="border-b border-warm-muted/30 py-8 text-center text-sm text-texto-principal/60">
                            {emptyMessage}
                        </p>
                    )}

                    {expenses.map((expense) => (
                        <div key={expense.id} className={`${HISTORY_GRID} border-b border-warm-muted/30 py-4 transition-colors hover:bg-group-paper`}>
                            <p className="text-xs text-warm-muted ps-3">{formatDate(expense.date)}</p>
                            <span className={`justify-self-start rounded-full px-2.5 py-1 text-xs font-medium ${categoryBadgeClass(expense.category)}`}>
                                {categoryLabel(expense.category)}
                            </span>
                            <p className="text-xs">{expense.title}</p>
                            <div className="flex max-w-full items-center gap-1.5 justify-self-start rounded-2xl bg-fondo py-0.5 pr-1.5 pl-0.5">
                                <Avatar name={expense.creditor.nickname} color={expense.creditor.color} photoUrl={expense.creditor.photoUrl} />
                                <p className="truncate text-sm font-medium">{expense.creditor.nickname}</p>
                            </div>
                            <p className="text-sm font-semibold">{formatCurrency(expense.amount)}</p>
                            {/* Tooltips hacia arriba: la tabla scrollea y un tooltip hacia abajo se recortaría en la última fila. */}
                            <div className="flex items-center justify-end gap-1">
                                <ReceiptAction
                                    title={expense.title}
                                    receiptUrl={expense.receiptUrl}
                                    label="Ver comprobante de gasto"
                                    disabledReason={expense.receiptUrl ? null : "Este gasto no tiene comprobante"}
                                    tooltipPlacement="top"
                                />
                                <ReceiptAction
                                    title={`pagos de ${expense.title}`}
                                    receiptUrls={expense.payments.map((payment) => payment.receiptUrl)}
                                    receiptCaptions={expense.payments.map((payment) => payment.payer.nickname)}
                                    icon={faFileInvoiceDollar}
                                    label={expense.payments.length > 1 ? "Ver comprobantes de pagos" : "Ver comprobante de pago"}
                                    disabledReason={expense.payments.length > 0 ? null : "Este gasto no tiene comprobantes de pago"}
                                    tooltipPlacement="top"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center gap-2 pt-4 pb-5">
                    <Button variant="page" size="icon" disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹</Button>
                    {visiblePages(page, totalPages).map((number) => (
                        <Button
                            key={number}
                            variant={number === page ? "success" : "page"}
                            size="icon"
                            onClick={() => onPageChange(number)}
                        >
                            {number}
                        </Button>
                    ))}
                    <Button variant="page" size="icon" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>›</Button>
                </div>
            )}
        </>
    );
}

// ---------------------------------------------------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------------------------------------------------

interface ExpenseHistoryPanelProps {
    readonly groupId: number;
    /** Qué gastos se listan; define también el título, los encabezados de fecha y monto y el texto del estado vacío. */
    readonly source: ExpenseHistorySource;
    /**
     * Si se indica, se agregan los filtros de Mes y Año (con el mes y año actuales por defecto); `firstYear` es el
     * año más antiguo que ofrece el filtro de año.
     */
    readonly period?: {readonly firstYear: number};
}

/** Historial de gastos del grupo: título, filtros, tabla y paginador. */
export function ExpenseHistoryPanel({groupId, source, period}: ExpenseHistoryPanelProps): ReactElement {
    const copy = SOURCE_COPY[source];
    const expenses = useHistoryExpenses(groupId, source);
    // Sin `status` el backend devuelve todas las membresías, también las de quienes ya salieron o se están yendo.
    const {data: members = []} = useGetGroupMembers(groupId);

    const today = useMemo(() => new Date(), []);
    const currentYear = today.getFullYear();

    const {filters, setFilter, pageItems, currentPage, totalPages, setPage} = useExpenseHistory(
        expenses,
        period ? {month: String(today.getMonth()), year: String(currentYear)} : undefined,
    );

    const monthOptions: SelectOption[] = [
        {value: ALL, label: "Todos"},
        ...MONTHS_FULL.map((label, index) => ({value: String(index), label})),
    ];

    const firstYear = period?.firstYear ?? currentYear;
    const yearOptions: SelectOption[] = Array.from(
        {length: Math.max(currentYear - firstYear + 1, 1)},
        (_, i) => String(currentYear - i),
    ).map((value) => ({value, label: value}));

    const categoryOptions: SelectOption[] = [
        {value: ALL, label: "Todas"},
        ...EXPENSE_CATEGORIES.map((value) => ({value, label: categoryLabel(value)})),
    ];

    const creditorOptions: SelectOption[] = [
        {value: ALL, label: "Cualquiera"},
        ...members.map((member) => ({value: String(member.id), label: member.nickname})),
    ];

    return (
        <section className="flex flex-col rounded-3xl bg-panel px-9 py-2">
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 pb-2">
                <p className="text-base font-semibold">{copy.title}</p>
                <div className="flex flex-wrap items-center gap-3">
                    {period && (
                        <>
                            <HistoryFilter id={`history-month-${groupId}`} label="Mes" options={monthOptions} value={filters.month} onChange={setFilter("month")} />
                            <HistoryFilter id={`history-year-${groupId}`} label="Año" options={yearOptions} value={filters.year} onChange={setFilter("year")} />
                        </>
                    )}
                    <HistoryFilter id={`history-category-${groupId}`} label="Categoría" options={categoryOptions} value={filters.category} onChange={setFilter("category")} />
                    <HistoryFilter id={`history-creditor-${groupId}`} label="A cargo de" options={creditorOptions} value={filters.creditorId} onChange={setFilter("creditorId")} />
                </div>
            </div>

            <ExpenseHistoryTable
                expenses={pageItems}
                dateHeader={copy.dateHeader}
                amountHeader={copy.amountHeader}
                emptyMessage={copy.emptyMessage}
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </section>
    );
}
