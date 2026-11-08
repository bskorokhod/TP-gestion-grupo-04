package EsNuestro.premium;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

interface PremiumSubscriptionRepository extends JpaRepository<PremiumSubscription, Long> {

    /** La suscripción del grupo, activa o cancelada: un grupo tiene a lo sumo una. */
    Optional<PremiumSubscription> findByGroup_Id(Long groupId);

    /** Si el usuario ya consumió su prueba gratuita en algún grupo. */
    boolean existsByTrialUserId(Long userId);
}
