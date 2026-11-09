package EsNuestro.premium;

import EsNuestro.common.time.AppTime;
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
 * {@link PaymentCard}) y cuándo corresponde cobrar. El cobro es simulado (ver {@code PremiumBillingJob}).
 * <p>
 * Un grupo tiene una única fila ({@code group_id} único) durante toda su vida: cancelar la deja en CANCELLED y volver a
 * suscribir al grupo la reactiva con los datos nuevos ({@link #resume}), así que no se conserva el historial de
 * períodos anteriores. Que la fila persista es lo que garantiza una sola prueba gratuita por grupo: si alguna vez tuvo
 * prueba, {@link #hasTrial()} sigue valiendo true y no se vuelve a otorgar.
 * <p>
 * Ciclo de vida:
 * <ul>
 *   <li><b>Prueba</b> ({@link #isOnTrial()}): ACTIVE sin primer cobro. Al llegar {@code nextBillingAt} (el fin de la
 *   prueba) se debita el primer mes; si el débito falla, el grupo vuelve al plan gratuito.</li>
 *   <li><b>Paga</b>: ACTIVE con primer cobro hecho. Cada mes se renueva {@code nextBillingAt}.</li>
 *   <li><b>Cancelada</b>: la prueba se corta en el acto; un plan pago deja de renovarse pero el grupo conserva el
 *   premium hasta {@link #endsAt} (el fin del período ya pagado), sin reembolso. Mientras tanto cualquiera puede
 *   reactivarla ({@link #reactivate}) y el nuevo pagador se cobra desde la próxima renovación.</li>
 * </ul>
 * La prueba gratuita por usuario se garantiza con {@code trial_user_id} único: vale el id del pagador si se le
 * otorgó la prueba y es null si no, y las columnas únicas admiten varios null. Cancelar no lo libera.
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

    /** Cobro simulado: si la tarjeta es de las que la pasarela rechaza siempre (ver {@link PaymentCard}). */
    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean cardDeclines;

    /** Inicio de la suscripción vigente: se reinicia al re-suscribir un grupo cuya suscripción ya terminó. */
    @Column(nullable = false)
    private Instant startedAt;

    /** Fin de la prueba gratuita; null si al grupo nunca se le otorgó una. No se borra al cancelar. */
    private Instant trialEndsAt;

    /** Id del pagador si se le otorgó la prueba gratuita, null si no. Único: una prueba por usuario. */
    @Column(name = "trial_user_id", unique = true)
    private Long trialUserId;

    /**
     * Cuándo se hizo el primer cobro de la suscripción vigente. Null mientras dura la prueba: es lo que distingue una
     * prueba en curso de una suscripción paga.
     */
    private Instant firstChargeAt;

    /** Con prueba, cuando termina; después, la próxima renovación. Sin sentido si está cancelada. */
    @Column(nullable = false)
    private Instant nextBillingAt;

    /** Cuándo se canceló la suscripción vigente; null si está activa. */
    private Instant cancelledAt;

    /** Hasta cuándo el grupo conserva el premium tras cancelar; null si la suscripción está activa. */
    private Instant endsAt;

    /** Cuándo se avisó que la prueba está por terminar; null si todavía no se avisó. */
    private Instant trialReminderSentAt;

    private PremiumSubscription(Group group, User payer, PaymentCard card, boolean withTrial, Instant now) {
        this.group = group;
        begin(payer, card, withTrial, now);
    }

    static PremiumSubscription start(Group group, User payer, PaymentCard card, boolean withTrial) {
        return new PremiumSubscription(group, payer, card, withTrial, Instant.now());
    }

    /**
     * Cancela la suscripción. Tanto una prueba como un plan pago deja de renovarse y el grupo lo conserva hasta
     * el fin de la prueba ({@link #trialEndsAt}) o del período pagado ({@link #endsAt}), respectivamente, sin reembolso.
     * Después de cancelada no se cobra más.
     */
    void cancel(Instant now) {
        if (!isActive()) {
            throw new IllegalStateException("The subscription is already cancelled");
        }
        this.status = PremiumSubscriptionStatus.CANCELLED;
        this.cancelledAt = now;
        this.endsAt = !nextBillingAt.isAfter(now) ? now : nextBillingAt;
    }

    /** Débito fallido: la suscripción termina en el acto y el grupo vuelve al plan gratuito. */
    void failPayment(Instant now) {
        if (!isActive()) {
            throw new IllegalStateException("The subscription is already cancelled");
        }
        this.status = PremiumSubscriptionStatus.CANCELLED;
        this.cancelledAt = now;
        this.endsAt = now;
    }

    /**
     * Reactiva una suscripción cancelada que todavía está vigente (período pagado). No se cobra nada ahora: el nuevo
     * pagador y su tarjeta se cobran desde la próxima renovación, que no cambia.
     */
    void reactivate(User payer, PaymentCard card, Instant now) {
        if (!isCancelledButInForce(now)) {
            throw new IllegalStateException("The subscription is not cancelled or its paid period already ended");
        }
        this.status = PremiumSubscriptionStatus.ACTIVE;
        this.cancelledAt = null;
        this.endsAt = null;
        applyPaymentData(payer, card);
    }

    /**
     * Corta la prueba en curso y empieza el plan pago en el acto con el pagador y la tarjeta nuevos. El servicio ya
     * verificó que el cobro simulado no sea rechazado. La prueba queda consumida.
     */
    void upgradeFromTrial(User payer, PaymentCard card, Instant now) {
        if (!isOnTrial()) {
            throw new IllegalStateException("The subscription is not on trial");
        }
        applyPaymentData(payer, card);
        this.firstChargeAt = now;
        this.nextBillingAt = plusOneMonth(now);
    }

    /** Registra un cobro exitoso: el primero (fin de la prueba) o una renovación. Avanza al mes siguiente. */
    void registerCharge() {
        Instant now = Instant.now();
        if (firstChargeAt == null) {
            firstChargeAt = nextBillingAt;
        }
        do {
            nextBillingAt = plusOneMonth(nextBillingAt);
        } while (!nextBillingAt.isAfter(now));
    }

    void markTrialReminderSent(Instant now) {
        this.trialReminderSentAt = now;
    }

    /**
     * Reactiva la suscripción de un grupo cuyo premium ya terminó, con un nuevo pagador y tarjeta. La prueba gratuita
     * solo puede otorgarse si el grupo nunca tuvo una; el servicio decide {@code withTrial} y acá se verifica que no se
     * otorgue una segunda.
     */
    void resume(User payer, PaymentCard card, boolean withTrial) {
        if (isActive()) {
            throw new IllegalStateException("The subscription is already active");
        }
        if (withTrial && hasTrial()) {
            throw new IllegalStateException("The group's free trial was already used");
        }
        begin(payer, card, withTrial, Instant.now());
    }

    private void begin(User payer, PaymentCard card, boolean withTrial, Instant now) {
        this.status = PremiumSubscriptionStatus.ACTIVE;
        this.cancelledAt = null;
        this.endsAt = null;
        applyPaymentData(payer, card);
        this.startedAt = now;
        if (withTrial) {
            this.trialEndsAt = now.plus(TRIAL_DAYS, ChronoUnit.DAYS);
            this.trialUserId = payer.getId();
            this.trialReminderSentAt = null;
            this.firstChargeAt = null;
            this.nextBillingAt = this.trialEndsAt;
        } else {
            // Sin prueba el primer mes se cobra al activar (el servicio ya verificó que la tarjeta no sea rechazada).
            this.firstChargeAt = now;
            this.nextBillingAt = plusOneMonth(now);
        }
    }

    private void applyPaymentData(User payer, PaymentCard card) {
        this.payer = payer;
        this.cardholderName = card.holderName();
        this.cardLast4 = card.last4();
        this.cardExpirationMonth = card.expirationMonth();
        this.cardExpirationYear = card.expirationYear();
        this.cardDeclines = card.declines();
    }

    private static Instant plusOneMonth(Instant instant) {
        return instant.atZone(AppTime.ZONE).plusMonths(1).toInstant();
    }

    public boolean isActive() {
        return status == PremiumSubscriptionStatus.ACTIVE;
    }

    /** Si la suscripción está en su período de prueba gratuita (no cancelada y sin primer cobro todavía). */
    public boolean isOnTrial() {
        return isActive() && firstChargeAt == null && startedWithTrial();
    }

    /** Cancelada pero con el período ya pagado todavía vigente: el grupo sigue siendo premium. */
    public boolean isCancelledButInForce(Instant now) {
        return status == PremiumSubscriptionStatus.CANCELLED && endsAt != null && endsAt.isAfter(now);
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
