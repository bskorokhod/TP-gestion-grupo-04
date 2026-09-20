package EsNuestro.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MemberInviteDTO(
        @NotNull Long userId,
        @NotBlank @Size(max = 30) String nickname
) {
}
