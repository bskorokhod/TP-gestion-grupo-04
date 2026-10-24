package EsNuestro.vote;

public enum VoteStatus {
    /** Se muestra a los miembros y admite votos (y cambios de voto). */
    ACTIVE,

    /**
     * Ya tiene resultado y se ejecutó: no se muestra entre las votaciones activas, pero se conserva (borrado lógico)
     * y se lista en el historial ({@code GET /groups/{id}/votes/history}).
     */
    FINALIZED
}
