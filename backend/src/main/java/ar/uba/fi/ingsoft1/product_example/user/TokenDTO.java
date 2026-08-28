package ar.uba.fi.ingsoft1.product_example.user;

import jakarta.validation.constraints.NotNull;

public record TokenDTO(
        @NotNull String accessToken,
        String refreshToken
) {
}
