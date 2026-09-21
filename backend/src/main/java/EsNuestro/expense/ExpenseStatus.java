package EsNuestro.expense;

public enum ExpenseStatus {
    /**
     * Esperando resolución de un admin. Si {@link Expense#getPendingDetails()} no es null,
     * es la edición de un gasto ya aprobado y sus deudas originales están suspendidas.
     */
    PENDING_APPROVAL,
    APPROVED,
    /**
     * Solo lo alcanzan gastos que nunca fueron aprobados: rechazar la edición de un gasto
     * aprobado restaura su estado {@link #APPROVED} anterior.
     */
    REJECTED
}
