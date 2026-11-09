package EsNuestro.member;

import EsNuestro.group.Group;
import EsNuestro.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
 * Membresía de un usuario en un grupo. Una única entidad cubre el ciclo de vida de la solicitud de ingreso
 * (según {@link #status}). Un usuario tiene a lo sumo una fila por grupo: si fue rechazado o se fue (DEACTIVATED) y vuelve a pedir
 * ingreso, se reutiliza la misma fila ({@link #requestAgain}). El par (apodo, color) no puede repetirse entre los miembros
 * que ocupan identidad en el grupo; esa regla la valida el servicio.
 */
@Entity(name = "group_members")
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_group_member_user", columnNames = {"group_id", "user_id"}))
@NoArgsConstructor
@Getter
public class GroupMember {

    // CVU de 22 dígitos o alias de 6 a 20 caracteres (letras, números, '.' y '-'); vacío = sin cargar.
    public static final String CVU_REGEX = "^(\\d{22}|[A-Za-z0-9.-]{6,20})?$";

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

    @Column(length = 22)
    private String cvu;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MembershipStatus status;

    @Column(nullable = false)
    private Instant requestedAt;

    private Instant joinedAt;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;


    private GroupMember(
            Group group, User user, String nickname, MemberColor color,
            MembershipStatus status, BigDecimal percentage
    ) {
        this.group = group;
        this.user = user;
        this.nickname = nickname;
        this.color = color;
        this.status = status;
        this.percentage = percentage;
        this.requestedAt = Instant.now();
        if (status == MembershipStatus.ACTIVE) {
            this.joinedAt = Instant.now();
        }
        group.addMember(this);
    }

    public static GroupMember founder(Group group, User user, String nickname, MemberColor color, BigDecimal percentage) {
        return new GroupMember(
                group, user, nickname, color, MembershipStatus.ACTIVE, percentage
        );
    }

    /** {@code requestedPercentage} es el porcentaje que pide el solicitante (null en modo equitativo). */
    public static GroupMember joinRequest(
            Group group, User user, String nickname, MemberColor color, BigDecimal requestedPercentage
    ) {
        return new GroupMember(group, user, nickname, color, MembershipStatus.PENDING, requestedPercentage);
    }

    /** Conserva el porcentaje solicitado; en modo equitativo el grupo lo recalcula al aprobar. */
    public void approve() {
        this.status = MembershipStatus.ACTIVE;
        this.joinedAt = Instant.now();
    }

    public void reject() {
        this.status = MembershipStatus.REJECTED;
    }

    public void requestAgain(String nickname, MemberColor color, BigDecimal requestedPercentage) {
        this.nickname = nickname;
        this.color = color;
        this.status = MembershipStatus.PENDING;
        this.percentage = requestedPercentage;
        this.requestedAt = Instant.now();
        this.joinedAt = null;
    }

    public void updatePercentage(BigDecimal percentage) {
        this.percentage = percentage;
    }

    /**
     * Abandona el grupo: queda DEACTIVATED y su porcentaje deja de existir. Si vuelve a pedir ingreso se reutiliza esta
     * misma fila; sus deudas canceladas siguen canceladas.
     */
    public void leave() {
        this.status = MembershipStatus.DEACTIVATED;
        this.percentage = null;
    }

    public void changeIdentity(String newNickname, MemberColor newColor) {
        this.nickname = newNickname;
        this.color = newColor;
    }

    public void changeCvu(String newCvu) {
        this.cvu = newCvu;
    }

    public boolean isActive() {
        return status == MembershipStatus.ACTIVE;
    }

    public boolean isViewer() {
        return status == MembershipStatus.ACTIVE;
    }

    public boolean canRequestAgain() {
        return status == MembershipStatus.REJECTED || status == MembershipStatus.DEACTIVATED;
    }
}