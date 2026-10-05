package EsNuestro.reservation.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancellationRequestCreateDTO(
        @NotBlank @Size(max = 500) String reason
) {
}
