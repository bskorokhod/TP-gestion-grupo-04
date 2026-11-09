package EsNuestro.premium;

import EsNuestro.group.Group;
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
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Aviso sobre el plan premium de un grupo. Se guarda uno por hecho (no uno por miembro): cada miembro lo recibe la
 * próxima vez que entra, salvo quien lo provocó, y solo si ya era miembro cuando ocurrió (ver
 * {@link PremiumNoticeRead}). Guarda el nombre de pila de las personas para que el aviso no cambie si después se
 * modifica su perfil.
 */
@Entity
@Table(name = "premium_notices")
@NoArgsConstructor
@Getter
public class PremiumNotice {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PremiumNoticeType type;

    /** Quien provocó el hecho; null si lo provocó el sistema (fin de prueba, débito fallido, fin de período). */
    private Long actorUserId;

    @Column(length = 100)
    private String actorName;

    /** Quien tiene contratado el plan en el momento del hecho. */
    private Long payerUserId;

    @Column(length = 100)
    private String payerName;

    /** Fecha relevante del aviso: hasta cuándo sigue vigente, cuándo termina la prueba o cuándo es el próximo cobro. */
    private Instant until;

    @Column(nullable = false)
    private Instant occurredAt;

    PremiumNotice(Group group, PremiumNoticeType type, User actor, User payer, Instant until) {
        this.group = group;
        this.type = type;
        this.actorUserId = actor == null ? null : actor.getId();
        this.actorName = actor == null ? null : actor.getName();
        this.payerUserId = payer == null ? null : payer.getId();
        this.payerName = payer == null ? null : payer.getName();
        this.until = until;
        this.occurredAt = Instant.now();
    }
}
