package EsNuestro.group;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record FinalizeExitsDTO(
        @NotEmpty List<Long> memberIds,
        @NotEmpty @Valid List<PercentageEntryDTO> percentages
) {
}