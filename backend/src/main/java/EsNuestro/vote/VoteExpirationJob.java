package EsNuestro.vote;

import EsNuestro.group.Group;
import EsNuestro.group.GroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class VoteExpirationJob {

    private final VoteService voteService;
    private final GroupService groupService; // Inyectamos el servicio en vez del repositorio

    /**
     * Se ejecuta al iniciar la aplicación (para aplicar retroactivamente el plazo
     * a las votaciones que no lo tienen) y luego limpia las expiradas.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("Running initial vote deadline backfill and expiration check...");
        Instant now = Instant.now();

        for (Group group : groupService.findAllGroups()) {
            try {
                voteService.backfillMissingVoteDeadlines(group.getId());
                voteService.rejectExpiredVotes(group.getId(), now);
            } catch (Exception e) {
                log.error("Error processing startup vote check for group {}", group.getId(), e);
            }
        }
        log.info("Startup check complete.");
    }

    /**
     * Se ejecuta cada 1 hora (al minuto 0 de cada hora).
     */
    @Scheduled(cron = "0 0 * * * *")
    public void rejectExpiredVotesHourly() {
        log.debug("Running hourly expired votes check...");
        Instant now = Instant.now();

        for (Group group : groupService.findAllGroups()) {
            try {
                voteService.rejectExpiredVotes(group.getId(), now);
            } catch (Exception e) {
                log.error("Error rejecting expired votes for group {}", group.getId(), e);
            }
        }
        log.info("Hourly check complete.");
    }
}