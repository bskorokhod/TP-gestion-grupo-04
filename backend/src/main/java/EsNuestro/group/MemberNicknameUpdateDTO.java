package EsNuestro.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MemberNicknameUpdateDTO(
        @NotBlank @Size(max = 30) String nickname
) {
}
