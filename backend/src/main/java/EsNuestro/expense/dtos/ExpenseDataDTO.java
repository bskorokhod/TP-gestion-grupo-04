package EsNuestro.expense.dtos;

import EsNuestro.expense.Expense;
import EsNuestro.expense.ExpenseCategory;
import EsNuestro.expense.SplitMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Datos de un gasto. Se usa para crearlo, editarlo (reemplazo completo), reenviarlo con cambios y proponerlo como
 * reporte (votación de modificación). El acreedor no se informa: es siempre quien registra el gasto, salvo en un
 * reporte, donde es siempre el acreedor del gasto original. {@code participants} son los deudores/asignados, y no
 * puede figurar entre ellos quien lo registra; puede ir vacía si nadie más participa del gasto, en cuyo caso no se
 * generan deudas. {@code category} es opcional: si no viene, el gasto queda en {@link ExpenseCategory#SIN_CATEGORIA}.
 * {@code closingDeadlineDays} es el plazo (en días desde la creación o la última edición/reporte) a partir del cual
 * el gasto se considera vencido para quien todavía debe su parte; no cierra ni borra nada automáticamente.
 */
public record ExpenseDataDTO(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 200) String description,
        ExpenseCategory category,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal totalAmount,
        @NotNull SplitMethod splitMethod,
        @NotNull @Valid List<ExpenseParticipantDTO> participants,
        @NotBlank @Size(max = 2048) String receiptUrl,
        @NotNull
        @Min(Expense.MIN_CLOSING_DEADLINE_DAYS)
        @Max(Expense.MAX_CLOSING_DEADLINE_DAYS)
        Integer closingDeadlineDays
) {
}
