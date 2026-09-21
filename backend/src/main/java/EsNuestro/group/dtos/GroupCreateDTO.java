package EsNuestro.group.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GroupCreateDTO(
        @NotBlank @Size(max = 30) String name,
        @NotBlank @Size(max = 500) String description,
        // Optional: defaults to the founder's username when left blank.
        @Size(max = 30) String founderNickname
) {
}
