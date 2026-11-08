package EsNuestro.premium;

import EsNuestro.common.time.AppTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Facturación simulada del plan premium. Cada minuto (y al arrancar, para recuperar lo que haya vencido mientras la
 * aplicación estuvo detenida) busca los grupos a los que les toca algo y delega en
 * {@link PremiumService#processGroup}: cobrar el fin de la prueba o la renovación mensual, dar de baja el plan
 * cancelado cuyo período pagado terminó, o avisar que la prueba está por terminar. Es idempotente.
 * <p>
 * No es transaccional a propósito: cada grupo se procesa en su propia transacción (con el lock del grupo), así que un
 * grupo con problemas no frena a los demás.
 */
@Slf4j
@Component
class PremiumBillingJob {

    private final PremiumSubscriptionRepository subscriptionRepository;
    private final PremiumService premiumService;

    PremiumBillingJob(PremiumSubscriptionRepository subscriptionRepository, PremiumService premiumService) {
        this.subscriptionRepository = subscriptionRepository;
        this.premiumService = premiumService;
    }

    @Scheduled(cron = "0 * * * * *", zone = AppTime.ZONE_ID)
    @EventListener(ApplicationReadyEvent.class)
    void processDueSubscriptions() {
        Instant now = Instant.now();

        Set<Long> groupIds = new LinkedHashSet<>();
        groupIds.addAll(subscriptionRepository.findGroupIdsWithDueBilling(PremiumSubscriptionStatus.ACTIVE, now));
        groupIds.addAll(subscriptionRepository.findGroupIdsWithEndedPeriod(PremiumSubscriptionStatus.CANCELLED, now));
        groupIds.addAll(subscriptionRepository.findGroupIdsWithTrialEndingBefore(
                PremiumSubscriptionStatus.ACTIVE, now.plus(PremiumService.TRIAL_REMINDER_DAYS, ChronoUnit.DAYS)
        ));

        for (Long groupId : groupIds) {
            try {
                premiumService.processGroup(groupId, now);
            } catch (Exception e) {
                log.error("Could not process the premium subscription of group {}", groupId, e);
            }
        }
    }
}
