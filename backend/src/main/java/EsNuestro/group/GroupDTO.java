package EsNuestro.group;

import java.time.Instant;

public record GroupDTO(
        Long id,
        String name,
        String description,
        Instant createdAt,
        int memberCount
) {
    static GroupDTO from(Group group) {
        long activeMembers = group.getMembers().stream()
                .filter(GroupMember::isActive)
                .count();
        return new GroupDTO(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getCreatedAt(),
                (int) activeMembers
        );
    }
}
