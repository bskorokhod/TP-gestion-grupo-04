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

import java.math.BigDecimal;
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

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    @Enumerated(EnumType.STRING)
    private GroupMemberExitReason exitReason;

    GroupMember(Group group, User user, String nickname, GroupRole role, MembershipStatus status, BigDecimal percentage) {
        this.group = group;
        this.user = user;
        this.nickname = nickname;
        this.role = role;
        this.status = status;
        this.percentage = percentage;
        this.invitedAt = Instant.now();
        if (status == MembershipStatus.ACTIVE) {
            this.joinedAt = Instant.now();
        }
        group.addMember(this);
    }

    void accept() {
        this.status = MembershipStatus.PENDING;
    }

    void activate(BigDecimal percentage) {
        this.status = MembershipStatus.ACTIVE;
        this.percentage = percentage;
        if (this.joinedAt == null) {
            this.joinedAt = Instant.now();
        }
    }

    void updatePercentage(BigDecimal percentage) {
        this.percentage = percentage;
    }

    void reject() {
        this.status = MembershipStatus.REJECTED;
    }

    void deactivateForLeaving() {
        this.status = MembershipStatus.DEACTIVATED;
        this.exitReason = GroupMemberExitReason.LEAVING;
    }

    void deactivateForRemoval() {
        this.status = MembershipStatus.DEACTIVATED;
        this.exitReason = GroupMemberExitReason.REMOVED;
    }

    void finalizeExit() {
        this.status = exitReason == GroupMemberExitReason.LEAVING
                ? MembershipStatus.LEFT
                : MembershipStatus.REMOVED;
        this.percentage = null;
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

    boolean isViewer() {
        return status == MembershipStatus.PENDING
                || status == MembershipStatus.ACTIVE
                || status == MembershipStatus.DEACTIVATED;
    }

    boolean isFounder() {
        return role == GroupRole.FOUNDER;
    }
}
