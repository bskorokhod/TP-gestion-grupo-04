package EsNuestro.group.dtos;

import EsNuestro.group.Group;

public record GroupPreviewDTO(String name) {
    public static GroupPreviewDTO from(Group group) {
        return new GroupPreviewDTO(group.getName());
    }
}