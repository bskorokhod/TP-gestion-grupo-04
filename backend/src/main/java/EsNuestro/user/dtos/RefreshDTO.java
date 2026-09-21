package EsNuestro.user.dtos;

import jakarta.validation.constraints.NotBlank;

public record RefreshDTO(
        @NotBlank String refreshToken
) {
}
