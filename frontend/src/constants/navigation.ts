import {ReactNode} from "react";

export interface GroupNavbarProps {
    children: ReactNode,
    groupId?: string;
    groupName?: string;
}

export const GROUP_PAGES = [
    { key: "reservas", label: "Reservas", pathSuffix: "/reservas" },
    { key: "gastos", label: "Gestión de gastos", pathSuffix: "/gastos" },
    { key: "balance", label: "Balance", pathSuffix: "/balance" },
    { key: "configuracion", label: "Configuración", pathSuffix: "/configuracion" },
];


export interface SubrouteConfig {
    title: string;
    description: string;
    activeTabKey: "reservas" | "gastos" | "balance" | "configuracion";
    goBackBtn: boolean
}

export const PAGES_NAVBAR_DATA: Record<string, SubrouteConfig> = {
    "reservas": {
        title: "...",
        description: "Disponibilidad de días y gestión de reservas.",
        activeTabKey: "reservas",
        goBackBtn: false
    },
    "gastos": {
        title: "...",
        description: "Gastos pendientes y propuestos.",
        activeTabKey: "gastos",
        goBackBtn: false
    },
    "balance": {
        title: "...",
        description: "Resumen e historial de gastos en un solo lugar.",
        activeTabKey: "balance",
        goBackBtn: false
    },
    "configuracion": {
        title: "...",
        description: "Ajustes y miembros del grupo.",
        activeTabKey: "configuracion",
        goBackBtn: false
    },
    // Sub-rutas de configuración
    "porcentajes": {
        title: "Porcentajes de propiedad",
        description: "Definí qué porcentaje del bien le corresponde a cada integrante del grupo. Podés bloquear porcentajes para que ajustar los demás automáticamente de forma equitativa.",
        activeTabKey: "configuracion",
        goBackBtn: true
    },
};

export type Routes = keyof typeof PAGES_NAVBAR_DATA;