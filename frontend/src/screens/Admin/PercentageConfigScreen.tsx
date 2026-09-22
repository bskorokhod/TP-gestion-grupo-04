import { useEffect, useMemo, useState } from "react";
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Sector, PieSectorShapeProps } from "recharts";

import { PercentageCard } from "@/components/AdminCard";
import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { GroupNavbar } from "@/components/GroupNavbar.tsx";
import { useCurrentGroup } from "@/contexts/GroupContext.tsx";
import { cn } from "@/lib/cn.ts";
import { autoBalancePercentages, canLockMemberPercentage, getPercentageDifference } from "@/lib/percentages";
import type { MemberPercentage } from "@/models/Percentage";
import { PercentageValueSchema } from "@/models/Percentage";
import { useGroupPercentages, useUpdateGroupPercentages } from "@/services/PercentageServices";

type LockErrors = Readonly<Record<string, string>>;

interface PercentageChartDatum {
    readonly memberId: string;
    readonly name: string;
    readonly value: number;
}

const CHART_COLORS: ReadonlyArray<string> = [
    "var(--custom-red)",
    "var(--custom-orange)",
    "var(--custom-green)",
    "var(--custom-lilac)",
    "var(--custom-me)",
    "var(--group-amber)",
];

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
    // La URL usa el código del grupo; la API de porcentajes usa el id numérico.
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

    const canSave =
        members.length > 0 && totalIsComplete && !hasInvalidPercentage && !updateMutation.isPending;

    const chartData = useMemo<PercentageChartDatum[]>(
        () =>
            members.map((member) => ({
                memberId: member.memberId,
                name: member.name,
                value: Math.max(0, member.percentage),
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
        <CommonLayout className="flex flex-col min-h-screen">
            <GroupNavbar children={undefined} groupName="" />

            <div className="flex flex-row flex-1 items-stretch gap-10 bg-background pt-12 px-30 pb-16 overflow-hidden">
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
                        <div className="bg-panel p-8 flex flex-col gap-4 items-center basis-5/7 rounded-2xl">
                            <p role="status"
                               className={cn("text-lg font-semibold text-right w-full", totalIsComplete ? "text-olive" : "text-group-danger")}>
                                {totalIsComplete
                                    ? "Total asignado: 100%"
                                    : difference > 0
                                        ? `Falta asignar ${difference}% para llegar al 100%`
                                        : `Te pasaste ${Math.abs(difference)}% del 100%`}
                            </p>

                            <div className="flex flex-col gap-6 w-full">
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

                            <div className="flex flex-row gap-3 justify-end items-center self-stretch overflow-hidden">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={updateMutation.isPending}
                                    className="flex flex-row justify-center items-center bg-panel rounded-[50px] border border-field/60 py-3 px-6 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="text-lg font-medium text-ink">Cancelar</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAutoBalance}
                                    disabled={updateMutation.isPending}
                                    className="flex flex-row justify-center items-center w-83 h-11 bg-accent/30 rounded-full border border-amber/30 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="text-lg font-medium text-ink">
                                        Ajustar equitativamente
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!canSave}
                                    aria-disabled={!canSave}
                                    className="flex flex-row justify-center items-center bg-brand rounded-[50px] border border-brand py-3 px-6 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="text-lg font-medium text-brand-foreground">
                                        {updateMutation.isPending ? "Guardando..." : "Guardar configuración"}
                                    </p>
                                </button>
                            </div>
                        </div>

                        <div id="percentage-chart" className="basis-2/7 rounded-2xl flex flex-col items-stretch justify-start gap-4">
                            {hasChartData ? (
                                <div className="flex-1 h-full relative">
                                    <div className="absolute inset-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="30%"
                                                    outerRadius="80%"
                                                    paddingAngle={0}
                                                    shape={(props: PieSectorShapeProps) => (
                                                        <Sector 
                                                            {...props} 
                                                            fill={CHART_COLORS[props.index % CHART_COLORS.length]} 
                                                        />
                                                    )}
                                                />
                                                <Tooltip formatter={(value) => `${value}%`} />
                                                <Legend position="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
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