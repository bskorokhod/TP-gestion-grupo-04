package EsNuestro.expense;

import java.math.BigDecimal;

/**
 * Cómo se concilia lo que un participante ya pagó con su parte nueva cuando el gasto se modifica o se elimina.
 * Es un cálculo puro, sin entidades.
 * <p>
 * Para un participante:
 * <ul>
 *   <li>{@code paid}: todo lo que pagó en total sobre su parte (el historial de pagos, que nunca se borra).</li>
 *   <li>{@code refunded}: lo que el acreedor ya le devolvió.</li>
 *   <li>{@code newShare}: su parte nueva (cero si ya no participa o si el gasto se elimina).</li>
 * </ul>
 * Lo que el acreedor retiene de él es {@code paid - refunded}. Se aplica a la parte nueva hasta cubrirla y el resto
 * es exceso, que el acreedor le debe devolver. El monto de la devolución es lo ya devuelto más el exceso: nunca baja
 * de lo ya devuelto y se recalcula entero en cada modificación, así que modificaciones sucesivas no se desfasan
 * (si la parte vuelve a subir, el exceso se reabsorbe y la devolución pendiente baja).
 * <p>
 * Ejemplo: un gasto de 60 entre A (acreedor), B y C; B pagó 20. Si se suma a D la parte de B pasa a 15: retenido 20,
 * aplicado 15, exceso 5, devolución de A a B de 5.
 */
final class DebtReconciliation {

    private DebtReconciliation() {
    }

    /**
     * @param appliedToShare cuánto de lo pagado cuenta como pago de la parte nueva
     * @param refundAmount   monto total de la devolución (lo ya devuelto más el exceso pendiente)
     */
    record Outcome(BigDecimal appliedToShare, BigDecimal refundAmount) {
    }

    static Outcome reconcile(BigDecimal newShare, BigDecimal paid, BigDecimal refunded) {
        BigDecimal held = paid.subtract(refunded).max(BigDecimal.ZERO);
        BigDecimal applied = newShare.min(held);
        BigDecimal excess = held.subtract(applied);
        return new Outcome(applied, refunded.add(excess));
    }
}
