package EsNuestro.expense;

public enum DebtKind {
    /** La parte de un participante en el gasto: debe pagarla al acreedor del gasto. */
    SHARE,

    /**
     * Devolución: lo que el acreedor del gasto le debe a un participante que pagó de más (porque el gasto se
     * modificó o se eliminó después de su pago). El deudor es el acreedor del gasto y el acreedor de la deuda es
     * el participante que pagó de más.
     */
    REFUND
}
