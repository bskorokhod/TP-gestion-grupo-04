import type { VoteType } from "@/models/Vote.ts";

/** Cantidad máxima de votaciones por página en cada sección (activas e historial). */
export const VOTES_PAGE_SIZE = 2;

export interface VoteSection {
    readonly type: VoteType;
    readonly title: string;
    readonly description: string;
    readonly emptyMessage: string;
}

export const FAILURE_REASON_LABEL: Readonly<Record<string, string>> = {
    "The reservation started before the vote reached a quorum": "La reserva comenzó antes de que la votación alcanzara el quorum",
    "The reservation was canceled by its owner": "La reserva fue cancelada por su dueño",
    "The reservation is no longer active": "La reserva ya no está activa",
};

export const SECTIONS: readonly VoteSection[] = [
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
