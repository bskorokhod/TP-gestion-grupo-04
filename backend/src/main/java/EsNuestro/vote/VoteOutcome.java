package EsNuestro.vote;

/** Resultado de una votación finalizada. */
public enum VoteOutcome {
    /** Alcanzó el quórum y su acción se ejecutó. */
    APPROVED,

    /** No alcanzó (o ya no puede alcanzar) el quórum; no se ejecuta nada. */
    REJECTED,

    /**
     * Alcanzó el quórum pero la acción ya no pudo ejecutarse (p. ej. un participante dejó el grupo
     * mientras se votaba). El motivo queda en {@code Vote.failureReason}.
     */
    EXECUTION_FAILED
}
