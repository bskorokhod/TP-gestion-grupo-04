package EsNuestro.expense.dtos;

import EsNuestro.expense.Debt;
import EsNuestro.expense.Expense;
import EsNuestro.expense.ExpenseCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

/**
 * Fila del historial de gastos saldados. Lleva lo que el historial muestra más los comprobantes: el de creación del
 * gasto ({@code receiptUrl}) y los de todos los pagos de sus deudas ({@code payments}, con quién subió cada uno).
 * Este endpoint expone los gastos de todo el grupo, así que esos comprobantes quedan visibles para cualquier miembro
 * que pueda ver el grupo, no solo para los involucrados en el gasto: es una decisión deliberada del historial.
 * Participantes y deudas siguen sin incluirse. {@code creditor} es quien estaba a cargo del gasto.
 */
public record SettledExpenseDTO(
        Long id,
        Instant createdAt,
        String title,
        ExpenseCategory category,
        ExpenseMemberDTO creditor,
        BigDecimal totalAmount,
        String receiptUrl,
        List<PaymentReceiptDTO> payments
) {

    /** {@code debtsWithPayments} son las deudas del gasto que tienen pagos; las que no tienen pueden omitirse. */
    public static SettledExpenseDTO from(Expense expense, Collection<Debt> debtsWithPayments) {
        return new SettledExpenseDTO(
                expense.getId(),
                expense.getCreatedAt(),
                expense.getDetails().getTitle(),
                expense.getDetails().getCategory(),
                ExpenseMemberDTO.from(expense.getDetails().getCreditor()),
                expense.getDetails().getTotalAmount(),
                expense.getDetails().getReceiptUrl(),
                PaymentReceiptDTO.fromDebts(debtsWithPayments)
        );
    }
}
