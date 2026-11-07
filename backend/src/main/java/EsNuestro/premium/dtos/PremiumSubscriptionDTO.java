package EsNuestro.premium.dtos;

import EsNuestro.premium.PremiumSubscription;

import java.time.Instant;

/**
 * Resultado de suscribir un grupo a premium. {@code trial} indica si se otorgó la prueba gratuita (una por usuario y
 * una por grupo); si no, {@code nextBillingAt} es el momento del primer cobro.
 */
public record PremiumSubscriptionDTO(
        Long groupId,
        boolean trial,
        Instant trialEndsAt,
        Instant startedAt,
        Instant nextBillingAt,
        String cardLast4
) {
    public static PremiumSubscriptionDTO from(PremiumSubscription subscription) {
        return new PremiumSubscriptionDTO(
                subscription.getGroup().getId(),
                subscription.hasTrial(),
                subscription.getTrialEndsAt(),
                subscription.getStartedAt(),
                subscription.getNextBillingAt(),
                subscription.getCardLast4()
        );
    }
}
