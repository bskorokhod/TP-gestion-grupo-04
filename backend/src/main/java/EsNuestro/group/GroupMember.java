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
 * Membresía de un usuario en un grupo. Una única entidad cubre los roles de fundador,
 * admin y miembro (según {@link #role}) y el ciclo de vida de la solicitud de ingreso
 * (según {@link #status}). El par (apodo, color) no puede repetirse entre los miembros
 * que ocupan identidad en el grupo; esa regla la valida el servicio.
 */
@Entity(name = "group_members")
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_group_member_user", columnNames = {"group_id", "user_id"}))
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
    private MemberColor color;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GroupRole role;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MembershipStatus status;

    @Column(nullable = false)
    private Instant requestedAt;

    private Instant joinedAt;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    @Enumerated(EnumType.STRING)
    private GroupMemberExitReason exitReason;

    private GroupMember(
            Group group, User user, String nickname, MemberColor color,
            GroupRole role, MembershipStatus status, BigDecimal percentage
    ) {
        this.group = group;
        this.user = user;
        this.nickname = nickname;
        this.color = color;
        this.role = role;
        this.status = status;
        this.percentage = percentage;
        this.requestedAt = Instant.now();
        if (status == MembershipStatus.ACTIVE) {
            this.joinedAt = Instant.now();
        }
        group.addMember(this);
    }

    static GroupMember founder(Group group, User user, String nickname, MemberColor color) {
        return new GroupMember(
                group, user, nickname, color, GroupRole.FOUNDER, MembershipStatus.ACTIVE, BigDecimal.valueOf(100)
        );
    }

    static GroupMember joinRequest(Group group, User user, String nickname, MemberColor color) {
        return new GroupMember(group, user, nickname, color, GroupRole.MEMBER, MembershipStatus.PENDING, null);
    }

    void approve() {
        this.status = MembershipStatus.ACTIVE;
        this.percentage = BigDecimal.ZERO;
        this.joinedAt = Instant.now();
    }

    void reject() {
        this.status = MembershipStatus.REJECTED;
    }

    void requestAgain(String nickname, MemberColor color) {
        this.nickname = nickname;
        this.color = color;
        this.role = GroupRole.MEMBER;
        this.status = MembershipStatus.PENDING;
        this.percentage = null;
        this.exitReason = null;
        this.requestedAt = Instant.now();
        this.joinedAt = null;
    }

    void updatePercentage(BigDecimal percentage) {
        this.percentage = percentage;
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

    void changeIdentity(String newNickname, MemberColor newColor) {
        this.nickname = newNickname;
        this.color = newColor;
    }

    boolean isActive() {
        return status == MembershipStatus.ACTIVE;
    }

    boolean isViewer() {
        return status == MembershipStatus.ACTIVE || status == MembershipStatus.DEACTIVATED;
    }

    boolean isFounder() {
        return role == GroupRole.FOUNDER;
    }

    boolean holdsOwnership() {
        return MembershipStatus.OWNERSHIP_HOLDING.contains(status);
    }

    boolean canRequestAgain() {
        return status == MembershipStatus.REJECTED || status == MembershipStatus.LEFT;
    }
}