package EsNuestro.group.dtos;

import EsNuestro.group.Group;
import EsNuestro.member.GroupMember;
import EsNuestro.member.GroupRole;
import EsNuestro.member.MembershipStatus;

import java.time.Instant;

/**
 * Vista de un grupo desde la perspectiva de quien consulta: {@code myRole} y {@code myStatus} son los
 * de su propia membresía. El {@code joinCode} viaja para todo miembro que puede ver el grupo, porque
 * es también el identificador del grupo en las URLs del frontend.
 */
public record GroupDTO(
        Long id,
        String name,
        String description,
        Instant createdAt,
        int memberCount,
        String joinCode,
        GroupRole myRole,
        MembershipStatus myStatus
) {
    public static GroupDTO from(Group group, GroupMember caller) {
        long activeMembers = group.getMembers().stream()
                .filter(GroupMember::isActive)
                .count();
        return new GroupDTO(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getCreatedAt(),
                (int) activeMembers,
                group.getJoinCode(),
                caller.getRole(),
                caller.getStatus()
        );
    }
}
