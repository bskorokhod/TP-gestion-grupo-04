package EsNuestro.group;

public record GroupPreviewDTO(String name) {
    static GroupPreviewDTO from(Group group) {
        return new GroupPreviewDTO(group.getName());
    }
}