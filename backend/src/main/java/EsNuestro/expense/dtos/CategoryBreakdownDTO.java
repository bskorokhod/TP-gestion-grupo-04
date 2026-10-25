package EsNuestro.expense.dtos;

import java.math.BigDecimal;
import java.util.List;

/** Lo gastado en un mes, total y por categoría (de mayor a menor). */
public record CategoryBreakdownDTO(BigDecimal total, List<CategorySpendingDTO> categories) {
}
