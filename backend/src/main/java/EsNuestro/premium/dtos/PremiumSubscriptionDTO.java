package EsNuestro.premium.dtos;

import EsNuestro.premium.PremiumSubscription;
import EsNuestro.premium.PremiumSubscriptionStatus;

import java.time.Instant;

/**
 * Resultado de suscribir, mejorar o cancelar. {@code trial} indica si la suscripción está en su prueba gratuita (una
 * por usuario y una por grupo); en ese caso {@code trialEndsAt} es cuándo termina y {@code nextBillingAt} cuándo se
 * debita el primer mes. Una suscripción cancelada no tiene {@code nextBillingAt} y trae {@code endsAt}: hasta cuándo el
 * grupo conserva el premium (el momento de la cancelación si era una prueba).
 */
public record PremiumSubscriptionDTO(
        Long groupId,
        PremiumSubscriptionStatus status,
        boolean trial,
        Instant trialEndsAt,
        Instant startedAt,
        Instant nextBillingAt,
        Instant cancelledAt,
        Instant endsAt,
        String cardLast4
) {
    public static PremiumSubscriptionDTO from(PremiumSubscription subscription) {
        boolean trial = subscription.isOnTrial();
        boolean active = subscription.isActive();
        return new PremiumSubscriptionDTO(
                subscription.getGroup().getId(),
                subscription.getStatus(),
                trial,
                trial ? subscription.getTrialEndsAt() : null,
                subscription.getStartedAt(),
                active ? subscription.getNextBillingAt() : null,
                subscription.getCancelledAt(),
                subscription.getEndsAt(),
                subscription.getCardLast4()
        );
    }
}
