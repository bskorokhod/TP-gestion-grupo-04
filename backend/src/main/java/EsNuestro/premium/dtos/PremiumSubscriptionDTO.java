package EsNuestro.premium.dtos;

import EsNuestro.premium.PremiumSubscription;
import EsNuestro.premium.PremiumSubscriptionStatus;

import java.time.Instant;

/**
 * Estado de la suscripción premium de un grupo, devuelto al suscribir y al cancelar. {@code trial} indica si la
 * suscripción vigente arrancó con la prueba gratuita (una por usuario y una por grupo); si no, {@code nextBillingAt}
 * es el momento del primer cobro. Una suscripción cancelada no tiene {@code nextBillingAt} ni {@code trialEndsAt}.
 */
public record PremiumSubscriptionDTO(
        Long groupId,
        PremiumSubscriptionStatus status,
        boolean trial,
        Instant trialEndsAt,
        Instant startedAt,
        Instant nextBillingAt,
        Instant cancelledAt,
        String cardLast4
) {
    public static PremiumSubscriptionDTO from(PremiumSubscription subscription) {
        boolean trial = subscription.startedWithTrial();
        boolean active = subscription.isActive();
        return new PremiumSubscriptionDTO(
                subscription.getGroup().getId(),
                subscription.getStatus(),
                trial,
                active && trial ? subscription.getTrialEndsAt() : null,
                subscription.getStartedAt(),
                active ? subscription.getNextBillingAt() : null,
                subscription.getCancelledAt(),
                subscription.getCardLast4()
        );
    }
}
