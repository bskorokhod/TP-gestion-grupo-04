package EsNuestro.premium;

import org.springframework.data.jpa.repository.JpaRepository;

interface PremiumSubscriptionRepository extends JpaRepository<PremiumSubscription, Long> {

    /** Si el usuario ya consumió su prueba gratuita en algún grupo. */
    boolean existsByTrialUserId(Long userId);
}
