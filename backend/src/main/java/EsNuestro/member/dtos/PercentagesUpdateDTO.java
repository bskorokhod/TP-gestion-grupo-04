package EsNuestro.member.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PercentagesUpdateDTO(
        @NotEmpty @Valid List<PercentageEntryDTO> percentages
) {
}