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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Suscripción premium de un grupo: registro de quién la contrató, con qué tarjeta (solo lo no sensible, ver
 * {@link PaymentCard}) y a partir de cuándo corresponde cobrar. Es la base de la facturación mensual; el cobro en sí
 * es simulado y todavía no existe.
 * <p>
 * Un grupo tiene una única fila ({@code group_id} único) durante toda su vida: cancelar la deja en CANCELLED
 * ({@link #cancel()}) y volver a suscribir al grupo la reactiva con los datos nuevos ({@link #resume}), así que no
 * se conserva el historial de períodos anteriores. Que la fila persista es lo que garantiza una sola prueba gratuita
 * por grupo: si alguna vez tuvo prueba, {@link #hasTrial()} sigue valiendo true y no se vuelve a otorgar.
 * <p>
 * La prueba gratuita por usuario se garantiza con {@code trial_user_id} único: vale el id del pagador si se le
 * otorgó la prueba y es null si no, y las columnas únicas admiten varios null. Cancelar no lo libera: la prueba
 * consumida no se recupera. Además de la consulta del servicio, esa restricción frena a dos suscripciones
 * simultáneas del mismo usuario en grupos distintos.
 * <p>
 * TODO(PREMIUM-BILLING): no hay job que haga avanzar {@link #nextBillingAt} cada mes ni que registre cobros/facturas.
 *  Hoy el premium dura hasta que alguien lo cancele.
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

    /** Miembro que contrató el plan vigente; cualquier miembro activo puede hacerlo (y cancelarlo). */
    @ManyToOne(optional = false)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @ColumnDefault("'ACTIVE'")
    private PremiumSubscriptionStatus status;

    @Column(nullable = false, length = 100)
    private String cardholderName;

    @Column(nullable = false, length = 4)
    private String cardLast4;

    @Column(nullable = false)
    private int cardExpirationMonth;

    @Column(nullable = false)
    private int cardExpirationYear;

    /** Inicio de la suscripción vigente: se reinicia al re-suscribir un grupo cancelado. */
    @Column(nullable = false)
    private Instant startedAt;

    /** Fin de la prueba gratuita; null si al grupo nunca se le otorgó una. No se borra al cancelar. */
    private Instant trialEndsAt;

    /** Id del pagador si se le otorgó la prueba gratuita, null si no. Único: una prueba por usuario. */
    @Column(name = "trial_user_id", unique = true)
    private Long trialUserId;

    /** Con prueba, cuando termina; sin prueba, el primer cobro corresponde desde el inicio. Sin sentido si está cancelada. */
    @Column(nullable = false)
    private Instant nextBillingAt;

    /** Cuándo se canceló la suscripción vigente; null si está activa. */
    private Instant cancelledAt;

    private PremiumSubscription(Group group, User payer, PaymentCard card, boolean withTrial, Instant now) {
        this.group = group;
        begin(payer, card, withTrial, now);
    }

    static PremiumSubscription start(Group group, User payer, PaymentCard card, boolean withTrial) {
        return new PremiumSubscription(group, payer, card, withTrial, Instant.now());
    }

    /**
     * Cancela la suscripción: el grupo deja de ser premium y no se factura más. No hay reembolso ni prorrateo (el
     * cobro es simulado). El que cancela no queda registrado; si hiciera falta auditarlo, agregarlo acá.
     */
    public void cancel() {
        if (!isActive()) {
            throw new IllegalStateException("The subscription is already cancelled");
        }
        this.status = PremiumSubscriptionStatus.CANCELLED;
        this.cancelledAt = Instant.now();
    }

    /**
     * Reactiva una suscripción cancelada con un nuevo pagador y tarjeta. La prueba gratuita solo puede otorgarse si el
     * grupo nunca tuvo una; el servicio decide {@code withTrial} y acá se verifica que no se otorgue una segunda.
     */
    void resume(User payer, PaymentCard card, boolean withTrial) {
        if (isActive()) {
            throw new IllegalStateException("The subscription is already active");
        }
        if (withTrial && hasTrial()) {
            throw new IllegalStateException("The group's free trial was already used");
        }
        this.cancelledAt = null;
        begin(payer, card, withTrial, Instant.now());
    }

    private void begin(User payer, PaymentCard card, boolean withTrial, Instant now) {
        this.status = PremiumSubscriptionStatus.ACTIVE;
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

    public boolean isActive() {
        return status == PremiumSubscriptionStatus.ACTIVE;
    }

    /** Si al grupo alguna vez se le otorgó la prueba gratuita (aunque haya terminado o la suscripción se haya cancelado). */
    public boolean hasTrial() {
        return trialEndsAt != null;
    }

    /** Si la suscripción vigente arrancó con prueba gratuita (no si el grupo la tuvo en un período anterior). */
    public boolean startedWithTrial() {
        return trialEndsAt != null && trialEndsAt.isAfter(startedAt);
    }
}
