package EsNuestro.expense.dtos;

import EsNuestro.expense.SplitMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Datos de un gasto. Se usa para crearlo, editarlo (reemplazo completo) y reenviarlo con cambios.
 * {@code creditorId} es el miembro que pagó y a quien se le debe: puede ser distinto de quien
 * registra el gasto.
 */
public record ExpenseDataDTO(
        @NotBlank @Size(max = 200) String description,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal totalAmount,
        @NotNull Long creditorId,
        @NotNull SplitMethod splitMethod,
        @NotEmpty @Valid List<ExpenseParticipantDTO> participants,
        @NotBlank @Size(max = 2048) String receiptUrl
) {
}
