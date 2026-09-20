package EsNuestro.group.dtos;

import EsNuestro.group.Group;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record JoinGroupDTO(
        @NotBlank @Pattern(regexp = Group.JOIN_CODE_REGEX) String joinCode,
        @NotBlank @Size(max = 30) String nickname
) {
}