package EsNuestro.expense.dtos;

import EsNuestro.expense.ExpenseCategory;
import EsNuestro.expense.SplitMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Datos de un gasto. Se usa para crearlo, editarlo (reemplazo completo) y reenviarlo con cambios.
 * El acreedor no se informa: es siempre quien registra el gasto. {@code participants} son los
 * deudores/asignados, y no puede figurar entre ellos quien lo registra; puede ir vacía si nadie más
 * participa del gasto, en cuyo caso no se generan deudas. {@code category} es opcional: si no viene, el gasto queda
 * en {@link ExpenseCategory#SIN_CATEGORIA}.
 */
public record ExpenseDataDTO(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 200) String description,
        ExpenseCategory category,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal totalAmount,
        @NotNull SplitMethod splitMethod,
        @NotNull @Valid List<ExpenseParticipantDTO> participants,
        @NotBlank @Size(max = 2048) String receiptUrl
) {
}
