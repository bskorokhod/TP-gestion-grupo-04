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
     * TODO: todavía no se puede crear (no hay endpoint ni ejecutor); ver {@link ConfigChangeVote}.
     */
    CONFIG_CHANGE
}
