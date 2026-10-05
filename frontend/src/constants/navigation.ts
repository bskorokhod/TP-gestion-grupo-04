import {ReactNode} from "react";

export interface GroupNavbarProps {
    children: ReactNode,
    groupName?: string;
}

export const GROUP_PAGES = [
    { key: "reservas", label: "Reservas", pathSuffix: "/reservas" },
    { key: "gastos", label: "Gestión de gastos", pathSuffix: "/gastos" },
    { key: "balance", label: "Balance", pathSuffix: "/balance" },
    { key: "votaciones", label: "Votaciones", pathSuffix: "/votaciones" },
    { key: "configuracion", label: "Configuración", pathSuffix: "/configuracion" },
];


export interface SubrouteConfig {
    title: string;
    description: string;
    activeTabKey: "reservas" | "gastos" | "balance" | "votaciones" | "configuracion";
    goBackBtn: boolean
}

export const PAGES_NAVBAR_DATA: Record<string, SubrouteConfig> = {
    "reservas": {
        title: "Calendario de reservas",
        description: "Consultá la disponibilidad y reservá fechas para usar el bien.",
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
    "votaciones": {
        title: "Votaciones",
        description: "Votaciones activas del grupo: revisá cada propuesta y emití tu voto.",
        activeTabKey: "votaciones",
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
        description: "Solo podés modificar tu propio porcentaje. Si el total no llega a 100%, varias funcionalidad del grupo quedan detenidas hasta completarlo.",
        activeTabKey: "configuracion",
        goBackBtn: true
    },
};

export type Routes = keyof typeof PAGES_NAVBAR_DATA;