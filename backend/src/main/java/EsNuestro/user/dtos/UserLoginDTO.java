package EsNuestro.user.dtos;

import EsNuestro.user.UserCredentials;
import jakarta.validation.constraints.NotBlank;

public record UserLoginDTO(
        @NotBlank String email,
        @NotBlank String password
) implements UserCredentials {
}
