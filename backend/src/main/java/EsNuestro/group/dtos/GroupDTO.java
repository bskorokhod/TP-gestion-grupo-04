package EsNuestro.group.dtos;

import EsNuestro.group.Group;
import EsNuestro.group.GroupStatus;
import EsNuestro.member.GroupMember;
import EsNuestro.member.MembershipStatus;

import java.math.BigDecimal;
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
        MembershipStatus myStatus,
        GroupSettingsDTO settings,
        GroupStatus status,
        BigDecimal assignedPercentage,
        BigDecimal missingPercentage
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
                caller.getStatus(),
                GroupSettingsDTO.from(group.getSettings()),
                group.getStatus(),
                group.assignedPercentage(),
                group.missingPercentage()
        );
    }
}
