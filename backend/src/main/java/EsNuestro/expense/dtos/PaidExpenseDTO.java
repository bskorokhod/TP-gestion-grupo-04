package EsNuestro.expense.dtos;

import EsNuestro.expense.Debt;
import EsNuestro.expense.ExpenseCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Fila del historial personal: un gasto en el que el caller tenía una parte y ya la pagó por completo. A diferencia de
 * {@link SettledExpenseDTO}, el monto es lo que pagó el caller ({@code paidAmount}) y no el total del gasto,
 * {@code creditor} es a quien se lo pagó y la fecha ({@code paidAt}) es cuándo el caller hizo el pago, no cuándo se
 * creó el gasto. Si pagó en varios aportes es la fecha del último, cuando terminó de pagar.
 * <p>
 * Lleva además el comprobante de creación del gasto ({@code receiptUrl}) y solo los comprobantes de los pagos del
 * propio caller ({@code payments}); los de otros participantes no se incluyen.
 */
public record PaidExpenseDTO(
        Long id,
        Instant paidAt,
        String title,
        ExpenseCategory category,
        ExpenseMemberDTO creditor,
        BigDecimal paidAmount,
        String receiptUrl,
        List<PaymentReceiptDTO> payments
) {

    public static PaidExpenseDTO from(Debt debt) {
        Instant lastPayment = debt.lastPaymentAt();
        return new PaidExpenseDTO(
                debt.getExpense().getId(),
                // Una parte paga siempre tiene pagos; la fecha del gasto es solo una red de seguridad.
                lastPayment != null ? lastPayment : debt.getExpense().getCreatedAt(),
                debt.getExpense().getDetails().getTitle(),
                debt.getExpense().getDetails().getCategory(),
                ExpenseMemberDTO.from(debt.getCreditor()),
                debt.getPaidAmount(),
                debt.getExpense().getDetails().getReceiptUrl(),
                PaymentReceiptDTO.fromDebts(List.of(debt))
        );
    }
}
