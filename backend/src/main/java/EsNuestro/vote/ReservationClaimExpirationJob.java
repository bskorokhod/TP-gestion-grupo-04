package EsNuestro.vote;

import EsNuestro.common.time.AppTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Cierra los reclamos de reservas que no alcanzaron el quorum antes de que la reserva comience: reclamar una reserva
 * que ya empezó no tiene sentido, así que el reclamo se rechaza. Corre a medianoche (hora de Buenos Aires) y al
 * arrancar la aplicación, para recuperar lo que haya vencido mientras estuvo detenida. Es idempotente.
 * <p>
 * No es transaccional a propósito: cada grupo se procesa en su propia transacción (con el lock del grupo, ver
 * {@code VoteService.rejectClaimsOfStartedReservations}), así que un grupo con problemas no frena a los demás.
 */
@Slf4j
@Component
class ReservationClaimExpirationJob {

    private final VoteRepository voteRepository;
    private final VoteService voteService;

    ReservationClaimExpirationJob(VoteRepository voteRepository, VoteService voteService) {
        this.voteRepository = voteRepository;
        this.voteService = voteService;
    }

    @Scheduled(cron = "0 0 0 * * *", zone = AppTime.ZONE_ID)
    @EventListener(ApplicationReadyEvent.class)
    void rejectClaimsOfStartedReservations() {
        LocalDate today = AppTime.today();
        List<Long> groupIds = voteRepository.findGroupIdsWithClaimsOfReservationsStartedBy(VoteStatus.ACTIVE, today);
        for (Long groupId : groupIds) {
            try {
                voteService.rejectClaimsOfStartedReservations(groupId, today);
            } catch (Exception e) {
                log.error("Could not reject the expired reservation claims of group {}", groupId, e);
            }
        }
    }
}
