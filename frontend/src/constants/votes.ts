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
    "The group is no longer premium": "El grupo ya no es premium",
    "The group is stopped: the percentages of the active members must add up to exactly 100%":
        "El grupo está detenido: los porcentajes de los miembros activos deben sumar exactamente 100%",
    "The expense cannot proceed because it involves inactive creditors or debtors":
        "El gasto incluye acreedores o deudores que ya no están activos en el grupo",
    "The expense can no longer be split": "El gasto ya no se puede repartir",
};

/** Motivos que el backend arma con datos variables: se reconocen por prefijo. */
const FAILURE_REASON_PREFIXES: ReadonlyArray<readonly [string, string]> = [
    ["The expense is no longer active", "El gasto ya no está vigente"],
    ["The group is stopped", "El grupo está detenido: los porcentajes de los miembros activos deben sumar exactamente 100%"],
    ["Votes of type", "Este tipo de votación todavía no se puede aplicar"],
];

export const GENERIC_FAILURE_REASON = "El estado del grupo cambió";

/** Motivo de una votación aprobada que no pudo aplicarse, en español; nunca el texto crudo del backend. */
export function describeFailureReason(reason: string | null | undefined): string {
    if (!reason) return GENERIC_FAILURE_REASON;
    const exact = FAILURE_REASON_LABEL[reason];
    if (exact) return exact;
    const prefixed = FAILURE_REASON_PREFIXES.find(([prefix]) => reason.startsWith(prefix));
    return prefixed ? prefixed[1] : GENERIC_FAILURE_REASON;
}

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
