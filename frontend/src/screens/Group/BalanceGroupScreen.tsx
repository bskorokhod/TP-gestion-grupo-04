import {useMemo, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import Navbar from "@/components/Navbar.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import {ViewToggle} from "@/components/ViewToggle.tsx";
import Button from "@/components/Button.tsx";
import FilterSelect from "@/components/Forms/FilterSelect.tsx";
import type {SelectOption} from "@/components/Forms/SelectField.tsx";
import {Avatar} from "@/components/ui/Avatar.tsx";
import {
    categoryLabel,
    EXPENSE_CATEGORIES,
} from "@/constants/expenseCategories.ts";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {formatCurrency} from "@/lib/format.ts";
import {categoryBadgeClass, categoryChartColor, categoryDotClass, memberChartColor} from "@/lib/colors.ts";
import {
    useGetCategorySpending,
    useGetMonthlySpending,
    useGetSettledExpenses,
    type SpendingScope,
} from "@/services/BalanceServices.ts";
import {useGetGroupMembers} from "@/services/GroupServices.ts";

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_FULL = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PAGE_SIZE = 9;
const VISIBLE_PAGE_BUTTONS = 5;

const ALL = "ALL";

const LINE_COLOR = memberChartColor("GREEN");

const cardClass = "flex flex-1 flex-col gap-5 rounded-3xl bg-panel p-7";

const HISTORY_GRID = "grid grid-cols-[7.5rem_9rem_minmax(0,1fr)_12rem_7rem] items-center gap-x-4 pr-6";

/** Un mes concreto; `month` va de 0 (enero) a 11, como `Date#getMonth`. */
interface Period {
    readonly year: number;
    readonly month: number;
}

/** Posición del mes en una línea de tiempo continua, para comparar y desplazar períodos. */
function monthIndex({year, month}: Period): number {
    return year * 12 + month;
}

function CardHead({title, subtitle}: {title: string; subtitle: string}) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold text-texto-principal">{title}</p>
            <p className="text-xs text-texto-principal/60">{subtitle}</p>
        </div>
    );
}

function EmptyChart({message}: {message: string}) {
    return (
        <div className="flex h-56 items-center justify-center">
            <p className="text-sm text-texto-principal/60">{message}</p>
        </div>
    );
}

function formatDate(iso: string): string {
    const date = new Date(iso);
    const day = String(date.getDate()).padStart(2, "0");
    return `${day} ${MONTHS_SHORT[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
}

function visiblePages(current: number, total: number): number[] {
    const length = Math.min(VISIBLE_PAGE_BUTTONS, total);
    const start = Math.max(1, Math.min(current - Math.floor(VISIBLE_PAGE_BUTTONS / 2), total - length + 1));
    return Array.from({length}, (_, i) => start + i);
}

interface Slice {
    readonly name: string;
    readonly amount: number;
    readonly fill: string;
    readonly dot: string;
}

export const BalanceGroupScreen = () => {
    const group = useCurrentGroup();
    const {data: expenses} = useGetSettledExpenses(group.id);
    const {data: members = []} = useGetGroupMembers(group.id, "ACTIVE");

    const today = useMemo(() => new Date(), []);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Balance (torta y línea). El historial de abajo tiene sus propios filtros y no depende de esto.
    const [scope, setScope] = useState<SpendingScope>("GROUP");
    const [period, setPeriod] = useState<Period>({year: currentYear, month: currentMonth});

    const [month, setMonth] = useState<string>(String(currentMonth));
    const [year, setYear] = useState<string>(String(currentYear));
    const [category, setCategory] = useState<string>(ALL);
    const [creditorId, setCreditorId] = useState<string>(ALL);
    const [page, setPage] = useState(1);

    // No tiene sentido ir antes del mes en que se creó el grupo ni después del actual.
    const firstPeriod = useMemo<Period>(() => {
        const created = new Date(group.createdAt);
        return {year: created.getFullYear(), month: created.getMonth()};
    }, [group.createdAt]);
    const canGoBack = monthIndex(period) > monthIndex(firstPeriod);
    const canGoForward = monthIndex(period) < monthIndex({year: currentYear, month: currentMonth});

    const shiftMonth = (delta: number) => {
        setPeriod((current) => {
            const index = monthIndex(current) + delta;
            return {year: Math.floor(index / 12), month: index % 12};
        });
    };

    const {data: breakdown, isLoading: loadingBreakdown} = useGetCategorySpending(
        group.id, period.year, period.month + 1, scope,
    );
    const {data: monthlySpending, isLoading: loadingMonthly} = useGetMonthlySpending(group.id, period.year, scope);

    const changeFilter = (setter: (value: string) => void) => (value: string) => {
        setter(value);
        setPage(1);
    };

    const monthOptions: SelectOption[] = [
        {value: ALL, label: "Todos"},
        ...MONTHS_FULL.map((label, index) => ({value: String(index), label})),
    ];

    const firstYear = new Date(group.createdAt).getFullYear();
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

    const slices = useMemo<Slice[]>(
        () =>
            (breakdown?.categories ?? [])
                .map(({category: slice, amount}) => ({
                    name: categoryLabel(slice),
                    amount,
                    fill: categoryChartColor(slice),
                    dot: categoryDotClass(slice),
                }))
                .sort((a, b) => b.amount - a.amount),
        [breakdown],
    );

    const monthTotal = breakdown?.total ?? 0;

    // Los meses que todavía no llegaron no se grafican: un cero ahí se leería como "no se gastó nada".
    const monthlyPoints = useMemo(
        () =>
            MONTHS_SHORT.map((label, index) => {
                const isFuture = period.year === currentYear && index > currentMonth;
                const amount = monthlySpending?.find((entry) => entry.month === index + 1)?.amount ?? 0;
                return {month: label, total: isFuture ? null : amount};
            }),
        [monthlySpending, period.year, currentYear, currentMonth],
    );
    const monthlyHasData = (monthlySpending ?? []).some((entry) => entry.amount > 0);

    const filtered = useMemo(() => {
        return expenses
            .filter((expense) => {
                const date = new Date(expense.createdAt);
                if (date.getFullYear() !== Number(year)) return false;
                if (month !== ALL && date.getMonth() !== Number(month)) return false;
                if (category !== ALL && expense.category !== category) return false;
                return creditorId === ALL || expense.creditor.id === Number(creditorId);
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [expenses, year, month, category, creditorId]);

    const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const personal = scope === "ME";

    return (
        <div className="flex min-h-screen w-full flex-col bg-background font-poppins text-texto-principal">
            <Navbar />
            <GroupNavbar />

            <ViewToggle
                leftLabel="Vista grupal"
                rightLabel="Vista personal"
                rightActive={personal}
                onToggle={() => setScope((current) => (current === "GROUP" ? "ME" : "GROUP"))}
            />

            <main className="flex flex-col gap-6 px-24 pt-10 pb-12">
                <div className="flex gap-5">
                    {/* PieCard */}
                    <section className={cardClass}>
                        <div className="flex items-start justify-between gap-4">
                            <CardHead
                                title={personal ? "Tu parte por categoría" : "Gastos por categoría"}
                                subtitle={`${MONTHS_FULL[period.month]} ${period.year}`}
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="page"
                                    size="icon"
                                    aria-label="Mes anterior"
                                    disabled={!canGoBack}
                                    onClick={() => shiftMonth(-1)}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} aria-hidden />
                                </Button>
                                <Button
                                    variant="page"
                                    size="icon"
                                    aria-label="Mes siguiente"
                                    disabled={!canGoForward}
                                    onClick={() => shiftMonth(1)}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} aria-hidden />
                                </Button>
                            </div>
                        </div>
                        {loadingBreakdown ? (
                            <EmptyChart message="Cargando..." />
                        ) : slices.length === 0 ? (
                            <EmptyChart
                                message={personal
                                    ? "No tenés gastos saldados en este mes"
                                    : "No hay gastos saldados en este mes"}
                            />
                        ) : (
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6">
                                <div className="relative col-start-2 h-56 w-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={slices}
                                                dataKey="amount"
                                                nameKey="name"
                                                innerRadius="62%"
                                                outerRadius="100%"
                                                startAngle={90}
                                                endAngle={-270}
                                                stroke="white"
                                                strokeWidth={2}
                                                isAnimationActive={false}
                                            >
                                                {slices.map((slice) => (
                                                    <Cell key={slice.name} fill={slice.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-xl font-black">{formatCurrency(monthTotal)}</p>
                                        <p className="text-xs text-texto-principal/60">
                                            {personal ? "Tu parte del mes" : "Total del mes"}
                                        </p>
                                    </div>
                                </div>

                                <ul className="col-start-3 flex flex-col gap-3">
                                    {slices.map((slice) => (
                                        <li key={slice.name} className="flex items-start gap-3">
                                            <span className={`mt-1 size-2.5 shrink-0 rounded-full ${slice.dot}`} />
                                            <div className="flex flex-col">
                                                <p className="text-xs font-medium">{slice.name}</p>
                                                <p className="text-[10px] text-texto-principal/60">
                                                    {formatCurrency(slice.amount)} · {Math.round((slice.amount / monthTotal) * 100)}%
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* LineCard */}
                    <section className={cardClass}>
                        <CardHead
                            title={personal ? "Tu parte por mes" : "Gastos por mes"}
                            subtitle={`Evolución anual — ${period.year}`}
                        />
                        {loadingMonthly ? (
                            <EmptyChart message="Cargando..." />
                        ) : !monthlyHasData ? (
                            <EmptyChart
                                message={personal
                                    ? "No tenés gastos saldados en este año"
                                    : "No hay gastos saldados en este año"}
                            />
                        ) : (
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyPoints} margin={{top: 10, right: 12, left: 12, bottom: 0}}>
                                        <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                        <YAxis hide domain={[0, "auto"]} />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Line
                                            type="linear"
                                            dataKey="total"
                                            name={personal ? "Tu parte" : "Total"}
                                            stroke={LINE_COLOR}
                                            strokeWidth={2}
                                            dot={{r: 2}}
                                            connectNulls={false}
                                            isAnimationActive={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </section>
                </div>

                {/* HistCard */}
                <section className="flex flex-col rounded-3xl bg-panel px-9 py-2">
                    <div className="flex items-center justify-between pt-5 pb-2">
                        <p className="text-base font-semibold">Historial de gastos saldados</p>
                        <div className="flex items-center gap-3">
                            <FilterSelect id="filter-month" label="Mes" options={monthOptions} value={month} onChange={changeFilter(setMonth)} />
                            <FilterSelect id="filter-year" label="Año" options={yearOptions} value={year} onChange={changeFilter(setYear)} />
                            <FilterSelect id="filter-category" label="Categoría" options={categoryOptions} value={category} onChange={changeFilter(setCategory)} />
                            <FilterSelect id="filter-creditor" label="A cargo de" options={creditorOptions} value={creditorId} onChange={changeFilter(setCreditorId)} />
                        </div>
                    </div>

                    <div className={`${HISTORY_GRID} whitespace-nowrap border-b border-texto-principal py-4 text-sm font-medium`}>
                        <p>Fecha creación</p>
                        <p>Categoría</p>
                        <p>Nombre del gasto</p>
                        <p>A cargo de</p>
                        <p>Monto total</p>
                    </div>

                    {pageItems.length === 0 && (
                        <p className="border-b border-warm-muted/30 py-8 text-center text-sm text-texto-principal/60">
                            No hay gastos saldados para mostrar.
                        </p>
                    )}

                    {pageItems.map((expense) => (
                        <div key={expense.id} className={`${HISTORY_GRID} border-b border-warm-muted/30 py-4 transition-colors hover:bg-group-paper`}>
                            <p className="text-xs text-warm-muted ps-3">{formatDate(expense.createdAt)}</p>
                            <span className={`justify-self-start rounded-full px-2.5 py-1 text-xs font-medium ${categoryBadgeClass(expense.category)}`}>
                                {categoryLabel(expense.category)}
                            </span>
                            <p className="text-xs">{expense.title}</p>
                            <div className="flex max-w-full items-center gap-1.5 justify-self-start rounded-2xl bg-fondo py-0.5 pr-1.5 pl-0.5">
                                <Avatar name={expense.creditor.nickname} color={expense.creditor.color} photoUrl={expense.creditor.photoUrl} />
                                <p className="truncate text-sm font-medium">{expense.creditor.nickname}</p>
                            </div>
                            <p className="text-sm font-semibold">{formatCurrency(expense.totalAmount)}</p>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2 pt-4 pb-5">
                            <Button variant="page" size="icon" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</Button>
                            {visiblePages(currentPage, totalPages).map((number) => (
                                <Button
                                    key={number}
                                    variant={number === currentPage ? "success" : "page"}
                                    size="icon"
                                    onClick={() => setPage(number)}
                                >
                                    {number}
                                </Button>
                            ))}
                            <Button variant="page" size="icon" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>›</Button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};
