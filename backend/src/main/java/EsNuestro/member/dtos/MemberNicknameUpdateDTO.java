package EsNuestro.member.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MemberNicknameUpdateDTO(
        @NotBlank @Size(max = 30) String nickname
) {
}
