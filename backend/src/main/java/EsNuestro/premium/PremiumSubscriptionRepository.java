package EsNuestro.premium;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

interface PremiumSubscriptionRepository extends JpaRepository<PremiumSubscription, Long> {

    /** La suscripción del grupo, activa o cancelada: un grupo tiene a lo sumo una. */
    Optional<PremiumSubscription> findByGroup_Id(Long groupId);

    /** Si el usuario ya consumió su prueba gratuita en algún grupo. */
    boolean existsByTrialUserId(Long userId);

    /** Grupos con una suscripción activa a la que ya le toca cobrar (fin de la prueba o renovación mensual). */
    @Query("""
            select s.group.id from PremiumSubscription s
            where s.status = :status and s.nextBillingAt <= :now
            """)
    List<Long> findGroupIdsWithDueBilling(@Param("status") PremiumSubscriptionStatus status, @Param("now") Instant now);

    /** Grupos con la suscripción cancelada cuyo período pagado ya terminó pero que siguen figurando como premium. */
    @Query("""
            select s.group.id from PremiumSubscription s
            where s.status = :status and s.endsAt <= :now and s.group.premium = true
            """)
    List<Long> findGroupIdsWithEndedPeriod(@Param("status") PremiumSubscriptionStatus status, @Param("now") Instant now);

    /** Grupos en prueba que todavía no recibieron el aviso de que está por terminar y ya están dentro de la ventana. */
    @Query("""
            select s.group.id from PremiumSubscription s
            where s.status = :status and s.firstChargeAt is null and s.trialEndsAt is not null
              and s.trialReminderSentAt is null and s.trialEndsAt <= :limit
            """)
    List<Long> findGroupIdsWithTrialEndingBefore(
            @Param("status") PremiumSubscriptionStatus status, @Param("limit") Instant limit
    );
}
