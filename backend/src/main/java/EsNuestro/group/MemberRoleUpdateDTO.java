package EsNuestro.group;

import lombok.NonNull;

public record MemberRoleUpdateDTO(
        @NonNull GroupRole role
) {
}
