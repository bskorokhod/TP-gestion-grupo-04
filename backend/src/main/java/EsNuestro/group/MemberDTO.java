package EsNuestro.group;

import java.time.Instant;

public record MemberDTO(
        Long id,
        Long userId,
        String username,
        String nickname,
        GroupRole role,
        MembershipStatus status,
        Instant invitedAt,
        Instant joinedAt
) {
    static MemberDTO from(GroupMember member) {
        return new MemberDTO(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getNickname(),
                member.getRole(),
                member.getStatus(),
                member.getInvitedAt(),
                member.getJoinedAt()
        );
    }
}
