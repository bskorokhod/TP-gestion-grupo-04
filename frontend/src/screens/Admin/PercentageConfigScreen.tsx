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
import { useFormToasts } from "@/hooks/useFormToasts.ts";
import { useMyMember } from "@/hooks/useMyMember.ts";
import type { BackendError } from "@/hooks/useToast.ts";
import { cn } from "@/lib/cn.ts";
import { resolveChartColor } from "@/lib/colors";
import { getMaxPercentageFor, getPercentageDifference, roundToTwoDecimals } from "@/lib/percentages";
import { OwnershipPercentageSchema } from "@/models/Group.ts";
import { useGetGroupMembers } from "@/services/GroupServices.ts";
import { useUpdateMyPercentage } from "@/services/PercentageServices";

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

function toInputValue(percentage: number | null | undefined): string {
    return percentage == null ? "" : String(percentage);
}

/** Cada miembro modifica únicamente su propio porcentaje; el de los demás se ve en solo lectura. */
export const PercentageConfigScreen = () => {
    const group = useCurrentGroup();
    const myMember = useMyMember(group.id);
    const membersQuery = useGetGroupMembers(group.id, "ACTIVE");
    const updateMutation = useUpdateMyPercentage(group.id);
    const { showApiError, showSuccessToast } = useFormToasts();

    const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
    const savedPercentage = myMember?.percentage ?? null;

    const [draft, setDraft] = useState<string>("");

    // Sincroniza el input con lo guardado (carga inicial, guardado exitoso, cambios desde afuera).
    useEffect(() => {
        setDraft(toInputValue(savedPercentage));
    }, [savedPercentage]);

    const draftIsEmpty = draft.trim() === "";
    const validation = useMemo(
        () => OwnershipPercentageSchema.safeParse(draftIsEmpty ? undefined : Number(draft)),
        [draft, draftIsEmpty],
    );

    const isDirty = (draftIsEmpty ? null : Number(draft)) !== savedPercentage;

    const maxAllowed = myMember ? getMaxPercentageFor(members, myMember.id) : 0;
    const exceededBy =
        validation.success && validation.data > maxAllowed
            ? roundToTwoDecimals(validation.data - maxAllowed)
            : 0;

    const canSave = Boolean(myMember) && isDirty && validation.success && exceededBy === 0 && !updateMutation.isPending;

    // Vista previa: el porcentaje propio con lo que se está escribiendo (si es válido).
    const previewMembers = useMemo(
        () =>
            members.map((member) =>
                member.id === myMember?.id && validation.success
                    ? { ...member, percentage: validation.data }
                    : member,
            ),
        [members, myMember?.id, validation],
    );

    const difference = useMemo(() => getPercentageDifference(previewMembers), [previewMembers]);
    const totalIsComplete = difference === 0;

    const chartData = useMemo<PercentageChartDatum[]>(
        () =>
            previewMembers.map((member, index) => ({
                memberId: String(member.id),
                name: member.nickname,
                value: Math.max(0, member.percentage ?? 0),
                color: resolveChartColor(member.color, index),
            })),
        [previewMembers],
    );

    const hasChartData = useMemo(() => chartData.some((datum) => datum.value > 0), [chartData]);

    const handleCancel = () => {
        setDraft(toInputValue(savedPercentage));
    };

    const handleSave = () => {
        if (!canSave || !validation.success) {
            return;
        }

        updateMutation.mutate(
            { percentage: validation.data },
            {
                onSuccess: (updated) => {
                    showSuccessToast(
                        "Porcentaje actualizado",
                        `Tu porcentaje de propiedad ahora es ${updated.percentage}%.`,
                    );
                },
                onError: (error) => {
                    showApiError(error as BackendError, "No se pudo guardar tu porcentaje");
                },
            },
        );
    };

    const isLoading = membersQuery.isLoading;
    const isError = membersQuery.isError;

    return (
        <CommonLayout className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
            <GroupNavbar children={undefined} groupName="" />

            <div className="flex flex-col lg:flex-row flex-1 lg:min-h-0 items-stretch gap-6 bg-background pt-4 px-4 sm:px-12 lg:px-30 pb-6 lg:overflow-hidden">
                {isLoading && (
                    <p className="text-base text-warm-muted">Cargando porcentajes del grupo...</p>
                )}

                {isError && (
                    <p role="alert" className="text-base font-medium text-group-danger">
                        No se pudieron cargar los porcentajes del grupo.
                    </p>
                )}

                {!isLoading && !isError && (
                    <>
                        <div className="bg-panel p-5 flex flex-col gap-2.5 items-center w-full lg:basis-3/4 lg:min-h-0 rounded-2xl order-2 lg:order-1">

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full flex-1 min-h-0 content-start overflow-visible">
                                {members.map((member) => {
                                    const isMine = member.id === myMember?.id;
                                    return (
                                        <PercentageCard
                                            key={member.id}
                                            member={member}
                                            percentage={member.percentage ?? 0}
                                            editable={isMine}
                                            inputValue={isMine ? draft : undefined}
                                            disabled={updateMutation.isPending}
                                            onInputChange={isMine ? setDraft : undefined}
                                        />
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-1 w-full">
                                <p
                                    role="status"
                                    className={cn(
                                        "text-sm font-semibold text-right w-full leading-none",
                                        totalIsComplete ? "text-olive" : "text-group-danger",
                                    )}
                                >
                                    {totalIsComplete
                                        ? "Total asignado: 100%"
                                        : difference > 0
                                            ? `Falta asignar ${difference}% para llegar al 100%`
                                            : `Te pasaste ${Math.abs(difference)}% del 100%`}
                                </p>
                            </div>

                            <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 justify-center lg:justify-end items-center self-stretch">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={updateMutation.isPending || !isDirty}
                                    className="flex flex-row justify-center items-center bg-panel rounded-[50px] border border-field/60 py-2 px-4 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="text-base font-medium text-ink">Cancelar</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!canSave}
                                    aria-disabled={!canSave}
                                    className="flex flex-row justify-center items-center bg-brand rounded-[50px] border border-brand py-2 px-4 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="text-base font-medium text-brand-foreground whitespace-nowrap">
                                        {updateMutation.isPending
                                            ? "Guardando..."
                                            : !isDirty
                                                ? "Cambios guardados"
                                                : "Guardar mi porcentaje"}
                                    </p>
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
