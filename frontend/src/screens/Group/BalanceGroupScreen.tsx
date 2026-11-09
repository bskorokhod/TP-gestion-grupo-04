import {useMemo, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import Navbar from "@/components/Navbar.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import {ViewToggle} from "@/components/ViewToggle.tsx";
import Button from "@/components/Button.tsx";
import {ExpenseHistoryPanel} from "@/components/Expenses/ExpenseHistory.tsx";
import {categoryLabel} from "@/constants/expenseCategories.ts";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {formatCurrency, MONTHS_FULL, MONTHS_SHORT} from "@/lib/format.ts";
import {categoryChartColor, categoryDotClass, memberChartColor} from "@/lib/colors.ts";
import {type SpendingScope, useGetCategorySpending, useGetMonthlySpending} from "@/services/BalanceServices.ts";
import Footer from "@/components/Footer.tsx";
import {PremiumContentModal} from "@/components/modals/PremiumContentModal.tsx";
import type {ExpenseCategory} from "@/models/Expense.ts";

const LINE_COLOR = memberChartColor("GREEN");

const cardClass = "flex flex-1 flex-col gap-5 rounded-3xl bg-panel p-7";

/** Un mes concreto; `month` va de 0 (enero) a 11, como `Date#getMonth`. */
interface Period {
    readonly year: number;
    readonly month: number;
}

/** Posición del mes en una línea de tiempo continua, para comparar y desplazar períodos. */
function monthIndex({year, month}: Period): number {
    return year * 12 + month;
}

function CardHead({title, subtitle}: { title: string; subtitle: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold text-texto-principal">{title}</p>
            <p className="text-xs text-texto-principal/60">{subtitle}</p>
        </div>
    );
}

function EmptyChart({message}: { message: string }) {
    return (
        <div className="flex h-56 items-center justify-center">
            <p className="text-sm text-texto-principal/60">{message}</p>
        </div>
    );
}

interface Slice {
    readonly name: string;
    readonly amount: number;
    readonly fill: string;
    readonly dot: string;
}

const MOCK_SLICES: readonly Slice[] = [
    {name: "Mantenimiento", amount: 125000, fill: categoryChartColor("MANTENIMIENTO"), dot: categoryDotClass("MANTENIMIENTO")},
    {name: "Servicios", amount: 78000, fill: categoryChartColor("SERVICIOS"), dot: categoryDotClass("SERVICIOS")},
    {name: "Compras", amount: 42000, fill: categoryChartColor("COMPRAS"), dot: categoryDotClass("COMPRAS")},
];

const MOCK_MONTHLY_SPENDING = [42000, 65000, 58000, 92000, 78000, 115000, 85000, 99000, 74000, 125000, 0, 0]
    .map((amount, index) => ({month: index + 1, amount}));

export const BalanceGroupScreen = () => {
    const group = useCurrentGroup();

    const isPremium = group.isPremium;

    const today = useMemo(() => new Date(), []);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Balance (torta y línea). El historial de abajo tiene sus propios filtros y no depende de esto.
    const [scope, setScope] = useState<SpendingScope>("GROUP");
    const [period, setPeriod] = useState<Period>({year: currentYear, month: currentMonth});

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
        isPremium ? group.id : undefined, period.year, period.month + 1, scope,
    );
    const {data: monthlySpending, isLoading: loadingMonthly} = useGetMonthlySpending(
        isPremium ? group.id : undefined, period.year, scope,
    );

    const slices = useMemo<Slice[]>(
        () =>
            (isPremium ? breakdown?.categories ?? [] : MOCK_SLICES.map(({name, amount}) => ({
                category: name === "Mantenimiento" ? "MANTENIMIENTO" : name === "Servicios" ? "SERVICIOS" : "COMPRAS" as ExpenseCategory,
                amount,
            })))
                .map(({category: slice, amount}) => ({
                    name: categoryLabel(slice),
                    amount,
                    fill: categoryChartColor(slice),
                    dot: categoryDotClass(slice),
                }))
                .sort((a, b) => b.amount - a.amount),
        [breakdown, isPremium],
    );

    const monthTotal = isPremium ? breakdown?.total ?? 0 : MOCK_SLICES.reduce((total, slice) => total + slice.amount, 0);

    // Los meses que todavía no llegaron no se grafican: un cero ahí se leería como "no se gastó nada".
    const monthlyPoints = useMemo(
        () =>
            MONTHS_SHORT.map((label, index) => {
                const isFuture = period.year === currentYear && index > currentMonth;
                const amount = (isPremium ? monthlySpending ?? [] : MOCK_MONTHLY_SPENDING)
                    .find((entry) => entry.month === index + 1)?.amount ?? 0;
                return {month: label, total: isFuture ? null : amount};
            }),
        [monthlySpending, period.year, currentYear, currentMonth, isPremium],
    );
    const monthlyHasData = (isPremium ? monthlySpending ?? [] : MOCK_MONTHLY_SPENDING).some((entry) => entry.amount > 0);

    const personal = scope === "ME";

    return (
        <div className="flex min-h-screen w-full flex-col bg-background font-poppins text-texto-principal">
            <Navbar/>
            <GroupNavbar/>

            <ViewToggle
                leftLabel="Vista grupal"
                rightLabel="Vista personal"
                rightActive={personal}
                onToggle={() => setScope((current) => (current === "GROUP" ? "ME" : "GROUP"))}
            />

            <div className="relative flex-1">
                <main className={`flex flex-col gap-6 px-24 pt-10 pb-12 ${!isPremium ? "pointer-events-none select-none overflow-hidden" : ""}`}>
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
                                        <FontAwesomeIcon icon={faChevronLeft} aria-hidden/>
                                    </Button>
                                    <Button
                                        variant="page"
                                        size="icon"
                                        aria-label="Mes siguiente"
                                        disabled={!canGoForward}
                                        onClick={() => shiftMonth(1)}
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} aria-hidden/>
                                    </Button>
                                </div>
                            </div>
                            {loadingBreakdown ? (
                                <EmptyChart message="Cargando..."/>
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
                                                        <Cell key={slice.name} fill={slice.fill}/>
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => formatCurrency(Number(value))}/>
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
                                                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${slice.dot}`}/>
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
                                <EmptyChart message="Cargando..."/>
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
                                            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.1}/>
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}}/>
                                            <YAxis hide domain={[0, "auto"]}/>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))}/>
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
                    <ExpenseHistoryPanel
                        groupId={group.id}
                        source="GROUP"
                        period={{firstYear: firstPeriod.year}}
                        mocked={!isPremium}
                    />
                </main>

                {!isPremium && (
                    <PremiumContentModal groupCode={group.joinCode} contained lockScroll={false} dimBackground={false}/>
                )}
            </div>

            <Footer/>
        </div>
    );
};
