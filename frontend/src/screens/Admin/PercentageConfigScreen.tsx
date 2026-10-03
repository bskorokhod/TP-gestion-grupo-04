import { useEffect, useMemo, useState } from "react";
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Sector,
    Tooltip,
    type PieSectorDataItem,
    type PieSectorShapeProps,
} from "recharts";

import { PercentageCard } from "@/components/AdminCard";
import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { cn } from "@/lib/cn.ts";
import { resolveChartColor } from "@/lib/colors";
import { autoBalancePercentages, canLockMemberPercentage, getPercentageDifference } from "@/lib/percentages";
import type { MemberPercentage } from "@/models/Percentage";
import { PercentageValueSchema } from "@/models/Percentage";
import { useGroupPercentages, useUpdateGroupPercentages } from "@/services/PercentageServices";

type LockErrors = Readonly<Record<string, string>>;

interface PercentageChartDatum {
    readonly memberId: string;
    readonly name: string;
    readonly value: number;
    readonly color: string;
}

interface ChartTooltipProps {
    readonly active?: boolean;
    readonly payload?: ReadonlyArray<{ readonly name?: string; readonly value?: number | string }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }
    const { name, value } = payload[0];
    return (
        <div className="rounded-xl border border-field/60 bg-panel px-3 py-1.5 shadow-soft">
            <p className="text-sm font-semibold text-ink whitespace-nowrap">
                {name}: {value}%
            </p>
        </div>
    );
}

function renderActiveShape(props: PieSectorDataItem) {
    const outerRadius = typeof props.outerRadius === "number" ? props.outerRadius : 0;
    return <Sector {...(props as PieSectorShapeProps)} outerRadius={outerRadius + 6} />;
}

function withoutKey<T extends Record<string, string>>(record: T, key: string): T {
    const entries = Object.entries(record).filter(([entryKey]) => entryKey !== key);
    return Object.fromEntries(entries) as T;
}

function getMemberErrorMessage(member: MemberPercentage, lockErrors: LockErrors): string | undefined {
    const rangeResult = PercentageValueSchema.safeParse(member.percentage);
    if (!rangeResult.success) {
        return rangeResult.error.issues[0]?.message ?? "Porcentaje inválido";
    }
    return lockErrors[member.memberId];
}

export const PercentageConfigScreen = () => {
    const groupId = String(useCurrentGroup().id);

    const percentagesQuery = useGroupPercentages(groupId);
    const updateMutation = useUpdateGroupPercentages(groupId);

    const [members, setMembers] = useState<ReadonlyArray<MemberPercentage>>([]);
    const [lockErrors, setLockErrors] = useState<LockErrors>({});
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (percentagesQuery.data) {
            setMembers(percentagesQuery.data.members.map((member) => ({ ...member })));
            setLockErrors({});
            setSaveError(null);
        }
    }, [percentagesQuery.data]);

    const difference = useMemo(() => getPercentageDifference(members), [members]);
    const totalIsComplete = difference === 0;

    const hasInvalidPercentage = useMemo(
        () => members.some((member) => !PercentageValueSchema.safeParse(member.percentage).success),
        [members],
    );

    const isDirty = useMemo(() => {
        const saved = percentagesQuery.data?.members;
        if (!saved) {
            return false;
        }
        if (saved.length !== members.length) {
            return true;
        }
        const savedById = new Map(saved.map((member) => [member.memberId, member]));
        return members.some((member) => {
            const original = savedById.get(member.memberId);
            return !original || original.percentage !== member.percentage || original.locked !== member.locked;
        });
    }, [members, percentagesQuery.data]);

    const canSave =
        members.length > 0 && isDirty && totalIsComplete && !hasInvalidPercentage && !updateMutation.isPending;

    const chartData = useMemo<PercentageChartDatum[]>(
        () =>
            members.map((member, index) => ({
                memberId: member.memberId,
                name: member.name,
                value: Math.max(0, member.percentage),
                color: resolveChartColor(member.color, index),
            })),
        [members],
    );

    const hasChartData = useMemo(() => chartData.some((datum) => datum.value > 0), [chartData]);

    const handlePercentageChange = (memberId: string, value: number) => {
        setSaveError(null);
        setMembers((prev) =>
            prev.map((member) =>
                member.memberId === memberId && !member.locked
                    ? { ...member, percentage: value }
                    : member,
            ),
        );
    };

    const handleToggleLock = (memberId: string) => {
        setSaveError(null);
        setMembers((prev) => {
            const target = prev.find((member) => member.memberId === memberId);
            if (!target) {
                return prev;
            }

            if (target.locked) {
                setLockErrors((prevErrors) => withoutKey(prevErrors, memberId));
                return prev.map((member) =>
                    member.memberId === memberId ? { ...member, locked: false } : member,
                );
            }

            const rangeResult = PercentageValueSchema.safeParse(target.percentage);
            if (!rangeResult.success) {
                setLockErrors((prevErrors) => ({
                    ...prevErrors,
                    [memberId]: rangeResult.error.issues[0]?.message ?? "Porcentaje inválido",
                }));
                return prev;
            }

            if (!canLockMemberPercentage(prev, memberId, target.percentage)) {
                setLockErrors((prevErrors) => ({
                    ...prevErrors,
                    [memberId]:
                        "No se puede bloquear: la suma de los porcentajes bloqueados superaría el 100%",
                }));
                return prev;
            }

            setLockErrors((prevErrors) => withoutKey(prevErrors, memberId));
            return prev.map((member) =>
                member.memberId === memberId ? { ...member, locked: true } : member,
            );
        });
    };

    const handleAutoBalance = () => {
        setSaveError(null);
        setMembers((prev) => autoBalancePercentages(prev));
    };

    const handleCancel = () => {
        if (percentagesQuery.data) {
            setMembers(percentagesQuery.data.members.map((member) => ({ ...member })));
        }
        setLockErrors({});
        setSaveError(null);
    };

    const handleSave = () => {
        if (!canSave) {
            return;
        }

        setSaveError(null);
        updateMutation.mutate(
            {
                members: members.map(({ memberId, percentage, locked }) => ({
                    memberId,
                    percentage,
                    locked,
                })),
            },
            {
                onError: (mutationError) => {
                    setSaveError(
                        mutationError instanceof Error
                            ? mutationError.message
                            : "No se pudo guardar la configuración de porcentajes",
                    );
                },
            },
        );
    };

    return (
        <CommonLayout className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
            <GroupNavbar children={undefined} groupName="" />

            <div className="flex flex-col lg:flex-row flex-1 lg:min-h-0 items-stretch gap-6 bg-background pt-4 px-4 sm:px-12 lg:px-30 pb-6 lg:overflow-hidden">
                {percentagesQuery.isLoading && (
                    <p className="text-base text-warm-muted">Cargando porcentajes del grupo...</p>
                )}

                {percentagesQuery.isError && (
                    <p role="alert" className="text-base font-medium text-group-danger">
                        {percentagesQuery.error instanceof Error
                            ? percentagesQuery.error.message
                            : "No se pudieron cargar los porcentajes del grupo."}
                    </p>
                )}

                {!percentagesQuery.isLoading && !percentagesQuery.isError && (
                    <>
                        <div className="bg-panel p-5 flex flex-col gap-2.5 items-center w-full lg:basis-3/4 lg:min-h-0 rounded-2xl order-2 lg:order-1">
                            <p role="status"
                               className={cn("text-sm font-semibold text-right w-full leading-none", totalIsComplete ? "text-olive" : "text-group-danger")}>
                                {totalIsComplete
                                    ? "Total asignado: 100%"
                                    : difference > 0
                                        ? `Falta asignar ${difference}% para llegar al 100%`
                                        : `Te pasaste ${Math.abs(difference)}% del 100%`}
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full flex-1 min-h-0 content-start overflow-visible">
                                {members.map((member) => (
                                    <PercentageCard
                                        key={member.memberId}
                                        member={member}
                                        percentage={member.percentage}
                                        locked={member.locked}
                                        disabled={updateMutation.isPending}
                                        errorMessage={getMemberErrorMessage(member, lockErrors)}
                                        onPercentageChange={handlePercentageChange}
                                        onToggleLock={handleToggleLock}
                                    />
                                ))}
                            </div>

                            {saveError && (
                                <p role="alert" className="text-base font-medium text-group-danger self-stretch">
                                    {saveError}
                                </p>
                            )}

                            <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 justify-center lg:justify-end items-center self-stretch">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={updateMutation.isPending}
                                    className="flex flex-row justify-center items-center bg-panel rounded-[50px] border border-field/60 py-2 px-4 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="text-base font-medium text-ink">Cancelar</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAutoBalance}
                                    disabled={updateMutation.isPending}
                                    className="flex flex-row justify-center items-center h-10 px-4 bg-accent/30 rounded-full border border-amber/30 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="text-base font-medium text-ink whitespace-nowrap">Ajustar equitativamente</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!canSave}
                                    aria-disabled={!canSave}
                                    className="flex flex-row justify-center items-center bg-brand rounded-[50px] border border-brand py-2 px-4 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="text-base font-medium text-brand-foreground whitespace-nowrap">{updateMutation.isPending ? "Guardando..." : !isDirty ? "Cambios guardados" : "Guardar configuración"}</p>
                                </button>
                            </div>
                        </div>

                        <div id="percentage-chart" className="w-full lg:basis-1/4 rounded-2xl flex flex-col items-stretch justify-center gap-3 h-72 lg:h-auto lg:min-h-0 shrink-0 order-1 lg:order-2">
                            {hasChartData ? (
                                <>
                                    <div className="flex-1 min-h-0 relative">
                                        <div className="absolute inset-0 [&_*]:outline-none [&_*]:focus:outline-none">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart accessibilityLayer={false}>
                                                    <Pie
                                                        data={chartData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius="45%"
                                                        outerRadius="80%"
                                                        paddingAngle={2}
                                                        activeShape={renderActiveShape}
                                                    >
                                                        {chartData.map((entry) => (
                                                            <Cell
                                                                key={entry.memberId}
                                                                fill={entry.color}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<ChartTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-2 shrink-0">
                                        {chartData.map((entry) => (
                                            <li key={entry.memberId} className="flex items-center gap-2 text-sm text-ink">
                                                <span
                                                    aria-hidden="true"
                                                    className="inline-block w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: entry.color }}
                                                />
                                                <span className="truncate max-w-[9rem]">{entry.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p className="text-base text-warm-muted text-center py-16 flex-1 flex items-center justify-center">
                                    Todavía no hay porcentajes para graficar.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </CommonLayout>
    );
};