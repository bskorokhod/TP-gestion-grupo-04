export const SECTIONS = [
    {
        type: "EXTRAORDINARY_EXPENSE",
        title: "Gastos extraordinarios",
        description: "Gastos que alcanzan el umbral del grupo y se registran solo si se aprueban.",
        emptyMessage: "No hay gastos extraordinarios en votación.",
    },
    {
        type: "EXPENSE_REPORT",
        title: "Reportes de gasto",
        description: "Pedidos para modificar o eliminar gastos ya registrados.",
        emptyMessage: "No hay reportes de gasto en votación.",
    },
    {
        type: "RESERVATION_CLAIM",
        title: "Reclamos de reservas",
        description: "Pedidos para cancelar la reserva de otro miembro.",
        emptyMessage: "No hay reclamos de reservas en votación.",
    },
    {
        type: "CONFIG_CHANGE",
        title: "Cambios de configuración",
        description: "Cambios en los ajustes del grupo. Requieren la aprobación unánime de los miembros.",
        emptyMessage: "No hay cambios de configuración en votación.",
    },
];