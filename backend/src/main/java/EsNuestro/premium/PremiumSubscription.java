package EsNuestro.premium;

import EsNuestro.group.Group;
import EsNuestro.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Suscripción premium de un grupo: registro de quién la contrató, con qué tarjeta (solo lo no sensible, ver
 * {@link PaymentCard}) y a partir de cuándo corresponde cobrar. Es la base de la facturación mensual; el cobro en sí
 * es simulado y todavía no existe.
 * <p>
 * Un grupo tiene a lo sumo una suscripción ({@code group_id} único), lo que ya garantiza una sola prueba gratuita por
 * grupo. La prueba gratuita por usuario se garantiza con {@code trial_user_id} único: vale el id del pagador si se le
 * otorgó la prueba y es null si no, y las columnas únicas admiten varios null. Además de la consulta del servicio,
 * esa restricción frena a dos suscripciones simultáneas del mismo usuario en grupos distintos.
 * <p>
 * TODO(PREMIUM-BILLING): no hay job que haga avanzar {@link #nextBillingAt} cada mes ni que registre cobros/facturas.
 *  Hoy el premium dura para siempre una vez activado.
 * <p>
 * TODO(PREMIUM-CANCELLATION): agregar el estado de la suscripción y el fin de la misma al implementar la cancelación.
 *  Al re-suscribir un grupo hay que reutilizar esta fila (por el {@code group_id} único) y la prueba del grupo ya
 *  está consumida.
 */
@Entity
@Table(name = "premium_subscriptions")
@NoArgsConstructor
@Getter
public class PremiumSubscription {

    public static final int TRIAL_DAYS = 7;

    @Id
    @GeneratedValue
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "group_id", nullable = false, unique = true)
    private Group group;

    /** Miembro que contrató el plan; cualquier miembro activo puede hacerlo. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @Column(nullable = false, length = 100)
    private String cardholderName;

    @Column(nullable = false, length = 4)
    private String cardLast4;

    @Column(nullable = false)
    private int cardExpirationMonth;

    @Column(nullable = false)
    private int cardExpirationYear;

    @Column(nullable = false, updatable = false)
    private Instant startedAt;

    /** Fin de la prueba gratuita; null si a esta suscripción no se le otorgó prueba. */
    private Instant trialEndsAt;

    /** Id del pagador si se le otorgó la prueba gratuita, null si no. Único: una prueba por usuario. */
    @Column(name = "trial_user_id", unique = true)
    private Long trialUserId;

    /** Con prueba, cuando termina; sin prueba, el primer cobro corresponde desde el inicio. */
    @Column(nullable = false)
    private Instant nextBillingAt;

    private PremiumSubscription(Group group, User payer, PaymentCard card, boolean withTrial, Instant now) {
        this.group = group;
        this.payer = payer;
        this.cardholderName = card.holderName();
        this.cardLast4 = card.last4();
        this.cardExpirationMonth = card.expirationMonth();
        this.cardExpirationYear = card.expirationYear();
        this.startedAt = now;
        if (withTrial) {
            this.trialEndsAt = now.plus(TRIAL_DAYS, ChronoUnit.DAYS);
            this.trialUserId = payer.getId();
            this.nextBillingAt = this.trialEndsAt;
        } else {
            this.nextBillingAt = now;
        }
    }

    static PremiumSubscription start(Group group, User payer, PaymentCard card, boolean withTrial) {
        return new PremiumSubscription(group, payer, card, withTrial, Instant.now());
    }

    public boolean hasTrial() {
        return trialEndsAt != null;
    }
}
