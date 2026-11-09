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
    EXTRAORDINARY_EXPENSE_THRESHOLD,

    /** Plazo (en días) que tiene una votación para cerrarse antes de rechazarse automáticamente. */
    VOTE_DEADLINE_DAYS;

    /**
     * El monto del gasto extraordinario y el plazo de cierre de las votaciones se pueden cambiar en cualquier grupo; el
     * resto requiere premium.
     * Si cambia, actualizar también {@code requiresPremium} en {@code ConfigurationScreen.tsx} del frontend.
     */
    public boolean requiresPremium() {
        return this != EXTRAORDINARY_EXPENSE_THRESHOLD && this != VOTE_DEADLINE_DAYS;
    }
}
