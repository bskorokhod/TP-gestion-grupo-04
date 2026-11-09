package EsNuestro.member.dtos;

import EsNuestro.member.GroupMember;
import jakarta.validation.constraints.Pattern;

public record MemberCvuUpdateDTO(
        @Pattern(regexp = GroupMember.CVU_REGEX) String cvu
) {
}
