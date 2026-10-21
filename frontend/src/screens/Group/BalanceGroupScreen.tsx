import {useMemo, useState} from "react";
import {CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import Navbar from "@/components/Navbar.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import Button from "@/components/Button.tsx";
import FilterSelect from "@/components/Forms/FilterSelect.tsx";
import type {SelectOption} from "@/components/Forms/SelectField.tsx";
import {Avatar} from "@/components/ui/Avatar.tsx";
import {
    categoryColor,
    categoryLabel,
    EXPENSE_CATEGORIES,
} from "@/constants/expenseCategories.ts";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {formatCurrency} from "@/lib/format.ts";
import {memberChartColor, memberColorClass} from "@/lib/colors.ts";
import {useGetSettledExpenses} from "@/services/BalanceServices.ts";
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

    const [month, setMonth] = useState<string>(String(currentMonth));
    const [year, setYear] = useState<string>(String(currentYear));
    const [category, setCategory] = useState<string>(ALL);
    const [creditorId, setCreditorId] = useState<string>(ALL);
    const [page, setPage] = useState(1);

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

    const slices = useMemo<Slice[]>(() => {
        const byCategory = new Map<string, Slice>();
        for (const expense of expenses) {
            const date = new Date(expense.createdAt);
            if (date.getFullYear() !== currentYear || date.getMonth() !== currentMonth) continue;

            const name = categoryLabel(expense.category);
            const color = categoryColor(expense.category);
            const existing = byCategory.get(name);
            byCategory.set(name, {
                name,
                amount: (existing?.amount ?? 0) + expense.totalAmount,
                fill: memberChartColor(color),
                dot: memberColorClass(color),
            });
        }
        return [...byCategory.values()].sort((a, b) => b.amount - a.amount);
    }, [expenses, currentYear, currentMonth]);

    const monthTotal = slices.reduce((sum, slice) => sum + slice.amount, 0);

    const monthly = useMemo(() => {
        const totals = MONTHS_SHORT.map((label) => ({month: label, total: 0}));
        let hasData = false;
        for (const expense of expenses) {
            const date = new Date(expense.createdAt);
            if (date.getFullYear() !== currentYear) continue;
            totals[date.getMonth()].total += expense.totalAmount;
            hasData = true;
        }
        return {totals, hasData};
    }, [expenses, currentYear]);

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

    return (
        <div className="flex min-h-screen w-full flex-col bg-background font-poppins text-texto-principal">
            <Navbar />
            <GroupNavbar>
                <Button variant="pill" size="hero">Exportar reporte</Button>
            </GroupNavbar>

            <main className="flex flex-col gap-6 px-24 pt-10 pb-12">
                <div className="flex gap-5">
                    {/* PieCard */}
                    <section className={cardClass}>
                        <CardHead title="Gastos por categoría" subtitle={`${MONTHS_FULL[currentMonth]} ${currentYear}`} />
                        {slices.length === 0 ? (
                            <EmptyChart message="Todavía no hay gastos saldados este mes" />
                        ) : (
                            <div className="flex items-center justify-between gap-6">
                                <div className="relative h-56 w-56 shrink-0">
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
                                        <p className="text-xs text-texto-principal/60">Total del mes</p>
                                    </div>
                                </div>

                                <ul className="flex flex-col gap-3">
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
                        <CardHead title="Gastos por mes" subtitle={`Evolución anual — ${currentYear}`} />
                        {!monthly.hasData ? (
                            <EmptyChart message="Todavía no hay gastos saldados este año" />
                        ) : (
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthly.totals} margin={{top: 10, right: 12, left: 12, bottom: 0}}>
                                        <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                        <YAxis hide domain={[0, "auto"]} />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Line
                                            type="linear"
                                            dataKey="total"
                                            name="Total"
                                            stroke={LINE_COLOR}
                                            strokeWidth={2}
                                            dot={{r: 2}}
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

                    <div className="flex items-center justify-between border-b border-texto-principal py-4 pr-6">
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <p>Fecha creación</p>
                            <p>Categoría</p>
                            <p>Nombre del gasto</p>
                        </div>
                        <div className="flex w-48 items-center gap-5 whitespace-nowrap text-sm font-medium">
                            <p>A cargo de</p>
                            <p className="w-25">Monto total</p>
                        </div>
                    </div>

                    {pageItems.length === 0 && (
                        <p className="border-b border-warm-muted py-8 text-center text-sm text-texto-principal/60">
                            No hay gastos saldados para mostrar.
                        </p>
                    )}

                    {pageItems.map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between border-b border-warm-muted py-4 pr-6">
                            <div className="flex items-center gap-4">
                                <p className="w-20 text-xs text-texto-principal/60">{formatDate(expense.createdAt)}</p>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${memberColorClass(categoryColor(expense.category))}`}>
                                    {categoryLabel(expense.category)}
                                </span>
                                <p className="text-xs">{expense.title}</p>
                            </div>
                            <div className="flex items-center gap-15">
                                <div className="flex items-center gap-1.5 rounded-2xl bg-fondo py-0.5 pr-1.5 pl-0.5">
                                    <Avatar name={expense.creditor.nickname} color={expense.creditor.color} photoUrl={expense.creditor.photoUrl} />
                                    <p className="text-sm font-medium">{expense.creditor.nickname}</p>
                                </div>
                                <p className="text-sm font-semibold">{formatCurrency(expense.totalAmount)}</p>
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2 pt-4 pb-5">
                            <Button variant="page" size="icon" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</Button>
                            {visiblePages(currentPage, totalPages).map((number) => (
                                <Button
                                    key={number}
                                    variant={number === currentPage ? "pageActive" : "page"}
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
