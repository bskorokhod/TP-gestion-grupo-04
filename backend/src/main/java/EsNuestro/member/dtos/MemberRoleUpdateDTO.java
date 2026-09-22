package EsNuestro.member.dtos;

import EsNuestro.member.GroupRole;
import lombok.NonNull;

public record MemberRoleUpdateDTO(
        @NonNull GroupRole role
) {
}
