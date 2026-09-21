package EsNuestro.member.dtos;

import EsNuestro.member.GroupMember;
import EsNuestro.member.MemberColor;
import EsNuestro.member.MembershipStatus;

import java.time.Instant;

public record JoinRequestDTO(
        Long memberId,
        Long groupId,
        String groupName,
        String nickname,
        MemberColor color,
        MembershipStatus status,
        Instant requestedAt
) {
    public static JoinRequestDTO from(GroupMember member) {
        return new JoinRequestDTO(
                member.getId(),
                member.getGroup().getId(),
                member.getGroup().getName(),
                member.getNickname(),
                member.getColor(),
                member.getStatus(),
                member.getRequestedAt()
        );
    }
}