package EsNuestro.expense;

public enum DebtStatus {
    ACTIVE,
    /**
     * La deuda pertenece a un gasto aprobado cuya edición está en revisión. No se borra para
     * poder restaurarla tal cual si la edición es rechazada, y no admite pagos mientras dure.
     */
    SUSPENDED
}
