package EsNuestro.expense;

public enum ExpenseStatus {
    /**
     * Esperando resolución de un admin. Si {@link Expense#getPendingDetails()} no es null,
     * es la edición de un gasto ya aprobado y sus deudas originales están suspendidas.
     * TODO(admin): revisar que hoy no se puede alcanzar: {@code createExpense} aprueba directo y ya no hay admins.
     */
    PENDING_APPROVAL,
    APPROVED,
    /**
     * Solo lo alcanzan gastos que nunca fueron aprobados: rechazar la edición de un gasto
     * aprobado restaura su estado {@link #APPROVED} anterior.
     * TODO(admin): revisar que hoy no se puede alcanzar (ver {@link #PENDING_APPROVAL}).
     */
    REJECTED,
    /**
     * Gasto eliminado (borrado lógico), ya sea directamente por su creador o por una votación de reporte.
     * Se conserva con sus datos, pagos y votaciones para el historial. Sus deudas por partes quedan en cero; si
     * alguien ya había pagado, quedan abiertas las devoluciones ({@link DebtKind#REFUND}) hasta que se paguen.
     */
    CANCELLED
}
