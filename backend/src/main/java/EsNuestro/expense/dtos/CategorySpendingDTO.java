package EsNuestro.expense.dtos;

import EsNuestro.expense.ExpenseCategory;

import java.math.BigDecimal;

/** Lo gastado en una categoría; solo se devuelven las categorías con monto mayor que cero. */
public record CategorySpendingDTO(ExpenseCategory category, BigDecimal amount) {
}
