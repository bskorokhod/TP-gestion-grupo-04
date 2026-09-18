export const GROUP_PAGES = [
    {
        key: "reservas",
        label: "Reservas",
        pathSuffix: "/reservas",
        description: "Disponibilidad de días y gestión de reservas.",
    },
    {
        key: "gastos",
        label: "Gestión de gastos",
        pathSuffix: "/gastos",
        description: "Gastos pendientes y propuestos.",
    },
    {
        key: "balance",
        label: "Balance",
        pathSuffix: "/balance",
        description: "Resumen e historial de gastos en un solo lugar.",
    },
    {
        key: "configuracion",
        label: "Configuración",
        pathSuffix: "/configuracion",
        description: "Ajustes y miembros del grupo.",
    },
];

export interface GroupNavbarProps {
    groupId?: string;
    groupName?: string;
}