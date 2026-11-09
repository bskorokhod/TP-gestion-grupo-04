package EsNuestro.expense;

public enum DebtStatus {
    ACTIVE,
    /**
     * La deuda pertenece a un gasto aprobado cuya edición está en revisión. No se borra para
     * poder restaurarla tal cual si la edición es rechazada, y no admite pagos mientras dure.
     */
    SUSPENDED,
    /**
     * El acreedor abandonó el grupo con la deuda sin saldar y esta se canceló. Es terminal: no cuenta en balances ni
     * resúmenes, no admite pagos, no bloquea a nadie y el deudor la sigue viendo con este estado.
     */
    CANCELED
}
