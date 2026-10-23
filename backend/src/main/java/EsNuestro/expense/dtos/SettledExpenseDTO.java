package EsNuestro.expense.dtos;

import EsNuestro.expense.Expense;
import EsNuestro.expense.ExpenseCategory;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Fila del historial de gastos saldados. A propósito solo lleva lo que el historial muestra: a diferencia de
 * {@link ExpenseDTO} no incluye comprobante, participantes ni deudas, porque este endpoint expone los gastos de todo el
 * grupo y no solo los de quien consulta. {@code creditor} es quien estaba a cargo del gasto.
 */
public record SettledExpenseDTO(
        Long id,
        Instant createdAt,
        String title,
        ExpenseCategory category,
        ExpenseMemberDTO creditor,
        BigDecimal totalAmount
) {

    public static SettledExpenseDTO from(Expense expense) {
        return new SettledExpenseDTO(
                expense.getId(),
                expense.getCreatedAt(),
                expense.getDetails().getTitle(),
                expense.getDetails().getCategory(),
                ExpenseMemberDTO.from(expense.getDetails().getCreditor()),
                expense.getDetails().getTotalAmount()
        );
    }
}
