package EsNuestro.expense.dtos;

import java.math.BigDecimal;

/**
 * Resumen financiero del caller dentro de un grupo: quién es él como miembro, cuánto debe,
 * cuánto le deben y cuántos gastos pendientes de aprobación son visibles para él.
 */
public record GroupSummaryDTO(
        ExpenseMemberDTO me,
        BigDecimal owes,
        BigDecimal owed,
        long pendingExpenses
) {
}