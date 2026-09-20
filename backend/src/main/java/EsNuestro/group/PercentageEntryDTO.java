package EsNuestro.group;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PercentageEntryDTO(
        @NotNull Long memberId,
        @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal percentage
) {
}