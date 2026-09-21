package EsNuestro.member.dtos;

import EsNuestro.member.GroupRole;
import EsNuestro.member.GroupMember;
import EsNuestro.member.MemberColor;
import EsNuestro.member.MembershipStatus;

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
    public static MemberDTO from(GroupMember member) {
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