package EsNuestro.vote;

/** Qué configuración del grupo se propone cambiar en una {@link ConfigChangeVote}. */
public enum ConfigSetting {
    /** Modo de repartición del bien (equitativo o porcentual). */
    DISTRIBUTION_MODE,

    /** Modelo de aprobación de votaciones. */
    VOTING_MODEL,

    /** Restricción de reservas; con FIXED_DAYS_PER_MONTH lleva además los días fijos por mes. */
    RESERVATION_LIMIT_POLICY,

    /** Monto a partir del cual un gasto es extraordinario. */
    EXTRAORDINARY_EXPENSE_THRESHOLD
}
