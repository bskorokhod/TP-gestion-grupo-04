package EsNuestro.group;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "groups")
@NoArgsConstructor
@Getter
public class Group {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupMember> members = new ArrayList<>();

    static final String JOIN_CODE_REGEX = "(?i)[A-Z]{3}-[0-9]{4}-[A-Z]{3}";

    @Column(nullable = false, updatable = false, unique = true, length = 12)
    private String joinCode;

    public Group(String name, String description, String joinCode) {
        this.name = name;
        this.description = description;
        this.joinCode = joinCode;
        this.createdAt = Instant.now();
    }
    void addMember(GroupMember member) {
        members.add(member);
    }
}
