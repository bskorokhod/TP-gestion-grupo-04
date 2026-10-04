package EsNuestro.vote;

/** Tipos de votación; el frontend los muestra en secciones separadas. */
public enum VoteType {
    /** Un gasto que alcanza el umbral extraordinario del grupo: se crea solo si la votación es positiva. */
    EXTRAORDINARY_EXPENSE,

    /**
     * Modificación o eliminación de un gasto ya registrado.
     * TODO: todavía no se puede crear (no hay endpoint ni ejecutor); ver {@link ExpenseReportVote}.
     */
    EXPENSE_REPORT,

    /**
     * Cambio en la configuración del grupo. Siempre requiere unanimidad, sin importar el modelo de
     * votación del grupo.
     * Se propone con {@code POST /groups/{id}/votes/config-change}; ver {@link ConfigChangeVote}.
     */
    CONFIG_CHANGE,

    /**
     * Reclamo sobre la reserva de otro miembro: si se aprueba, la reserva se cancela. Votan los miembros activos
     * salvo el dueño de la reserva, con el modelo de votación del grupo. Se abre solo al crear la solicitud de
     * cancelación ({@code POST /groups/{id}/reservations/{reservationId}/cancellation-requests}); ver
     * {@link ReservationClaimVote}.
     */
    RESERVATION_CLAIM
}
