package EsNuestro.expense.dtos;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Participante del reparto. {@code percentage} es obligatorio con CUSTOM (porcentaje del gasto
 * que le corresponde) y debe omitirse con EQUAL y PROPORTIONAL.
 */
public record ExpenseParticipantDTO(
        @NotNull Long memberId,
        @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal percentage
) {
}
