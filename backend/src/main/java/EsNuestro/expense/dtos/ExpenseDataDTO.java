package EsNuestro.expense.dtos;

import EsNuestro.expense.SplitMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Datos de un gasto. Se usa para crearlo, editarlo (reemplazo completo) y reenviarlo con cambios.
 * {@code creditorId} es el miembro que pagó y a quien se le debe (obligatorio): puede ser distinto
 * de quien registra el gasto. {@code participants} son los deudores/asignados: puede ir vacía si
 * nadie más participa del gasto, en cuyo caso no se generan deudas.
 */
public record ExpenseDataDTO(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 200) String description,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal totalAmount,
        @NotNull Long creditorId,
        @NotNull SplitMethod splitMethod,
        @NotNull @Valid List<ExpenseParticipantDTO> participants,
        @NotBlank @Size(max = 2048) String receiptUrl
) {
}
