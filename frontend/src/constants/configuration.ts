import type { GroupSettings } from "@/models/Group.ts";
import type { ModalSettingItem } from "@/models/Config.ts";
import {faCalendarCheck, faChartPie, faCheckToSlot, faCoins} from "@fortawesome/free-solid-svg-icons";

export const MODIFY_CONFIG_LABEL = "Solicitar modificación de configuración";
export const MODIFY_PERCENTAGES_LABEL = "Modificar porcentajes";

export const PERCENTAGES_SETTING = {
    title: "Configurar porcentajes de propiedad",
    description:
        "Definí qué porcentaje del bien le corresponde a cada integrante del grupo y ajustá la distribución cuando cambie.",
} as const;

const VOTING_VALUE_LABELS: Record<GroupSettings["votingModel"], string> = {
    SIMPLE_MAJORITY: "Mayoría simple",
    OWNERSHIP_WEIGHTED_MAJORITY: "Mayoría proporcional",
    UNANIMOUS: "Unánime",
};

const DISTRIBUTION_VALUE_LABELS: Record<GroupSettings["distributionMode"], string> = {
    EQUAL: "Equitativo",
    PERCENTAGE: "Porcentual",
};

function reservationValue(settings: GroupSettings): string {
    switch (settings.reservationLimitPolicy) {
        case "EQUAL":
            return "Equitativo";
        case "OWNERSHIP_PROPORTIONAL":
            return "Proporcional";
        case "FIXED_DAYS_PER_MONTH":
            return `${settings.reservationFixedDaysPerMonth ?? "-"} días por mes`;
    }
}

export const SETTINGS_INFO: ReadonlyArray<ModalSettingItem> = [
    {
        kind: "voting",
        icon: faCheckToSlot,
        title: "Modo de aprobación de votación",
        description:
            "Definí cómo se aprueban las votaciones: mayoría simple, mayoría proporcional al porcentaje de propiedad o unanimidad.",
        currentValue: (settings) => VOTING_VALUE_LABELS[settings.votingModel],
    },
    {
        kind: "reservation",
        icon: faCalendarCheck,
        title: "Restricciones de reservas",
        description:
            "Establecé cuántos días por mes puede reservar el bien cada miembro: equitativo, proporcional al porcentaje o una cantidad fija.",
        currentValue: reservationValue,
    },
    {
        kind: "threshold",
        icon: faCoins,
        title: "Monto de gasto extraordinario",
        description:
            "Monto a partir del cual un gasto se considera extraordinario y debe aprobarse por votación.",
        currentValue: (settings) =>
            `$ ${settings.extraordinaryExpenseThreshold.toLocaleString("es-AR")}`,
    },
    {
        kind: "distribution",
        icon: faChartPie,
        title: "Modo de repartición del bien",
        description:
            "Definí si el bien se reparte en partes iguales entre los miembros o según el porcentaje de cada uno.",
        currentValue: (settings) => DISTRIBUTION_VALUE_LABELS[settings.distributionMode],
    },
];