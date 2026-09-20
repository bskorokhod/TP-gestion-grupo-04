package EsNuestro.group;

import java.math.BigDecimal;
import java.time.Instant;

public record MemberDTO(
        Long id,
        Long userId,
        String username,
        String nickname,
        MemberColor color,
        GroupRole role,
        MembershipStatus status,
        BigDecimal percentage,
        Instant requestedAt,
        Instant joinedAt
) {
    static MemberDTO from(GroupMember member) {
        return new MemberDTO(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getNickname(),
                member.getColor(),
                member.getRole(),
                member.getStatus(),
                member.getPercentage(),
                member.getRequestedAt(),
                member.getJoinedAt()
        );
    }
}