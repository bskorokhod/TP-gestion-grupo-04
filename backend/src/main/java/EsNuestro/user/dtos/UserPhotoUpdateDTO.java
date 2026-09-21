package EsNuestro.user.dtos;

import jakarta.validation.constraints.NotBlank;

public record UserPhotoUpdateDTO(
        @NotBlank String newUrl) {
}