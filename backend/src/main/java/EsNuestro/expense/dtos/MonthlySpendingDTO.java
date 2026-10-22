package EsNuestro.expense.dtos;

import java.math.BigDecimal;

/** Lo gastado en un mes de un año; {@code month} va de 1 (enero) a 12. */
public record MonthlySpendingDTO(int month, BigDecimal amount) {
}
