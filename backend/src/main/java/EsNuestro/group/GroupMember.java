package EsNuestro.group;

import EsNuestro.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A user's membership in a group. This single entity plays the role of founder,
 * admin and plain member (via {@link #role}), and tracks the invitation lifecycle
 * (via {@link #status}), instead of splitting those concerns into separate
 * collections on {@link Group}.
 */
@Entity(name = "group_members")
@Table(uniqueConstraints = {
        @UniqueConstraint(name = "uk_group_member_nickname", columnNames = {"group_id", "nickname"}),
        @UniqueConstraint(name = "uk_group_member_user", columnNames = {"group_id", "user_id"})
})
@NoArgsConstructor
@Getter
public class GroupMember {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GroupRole role;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MembershipStatus status;

    @Column(nullable = false, updatable = false)
    private Instant invitedAt;

    private Instant joinedAt;

    GroupMember(Group group, User user, String nickname, GroupRole role, MembershipStatus status) {
        this.group = group;
        this.user = user;
        this.nickname = nickname;
        this.role = role;
        this.status = status;
        this.invitedAt = Instant.now();
        if (status == MembershipStatus.ACTIVE) {
            this.joinedAt = Instant.now();
        }
        group.addMember(this);
    }

    void accept() {
        this.status = MembershipStatus.ACTIVE;
        this.joinedAt = Instant.now();
    }

    void reject() {
        this.status = MembershipStatus.REJECTED;
    }

    void leave() {
        this.status = MembershipStatus.LEFT;
    }

    void remove() {
        this.status = MembershipStatus.REMOVED;
    }

    void changeRole(GroupRole newRole) {
        this.role = newRole;
    }

    void changeNickname(String newNickname) {
        this.nickname = newNickname;
    }

    boolean isActive() {
        return status == MembershipStatus.ACTIVE;
    }

    boolean isFounder() {
        return role == GroupRole.FOUNDER;
    }
}
