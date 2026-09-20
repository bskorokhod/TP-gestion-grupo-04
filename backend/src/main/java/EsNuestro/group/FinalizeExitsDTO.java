package EsNuestro.group;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record FinalizeExitsDTO(
        @NotEmpty List<Long> memberIds,
        @NotNull @Valid List<PercentageEntryDTO> percentages
) {
}