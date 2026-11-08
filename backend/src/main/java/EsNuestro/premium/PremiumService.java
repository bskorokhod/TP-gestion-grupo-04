package EsNuestro.premium;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.common.time.AppTime;
import EsNuestro.group.Group;
import EsNuestro.group.GroupService;
import EsNuestro.member.GroupMember;
import EsNuestro.premium.dtos.PremiumEligibilityDTO;
import EsNuestro.premium.dtos.PremiumSubscribeDTO;
import EsNuestro.premium.dtos.PremiumSubscriptionDTO;
import EsNuestro.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * Suscripción de grupos al plan premium. El pago es simulado: se validan y registran los datos del formulario como
 * base de la facturación mensual, sin pasarela externa ni cobro real.
 * <p>
 * Para encontrar todos los pendientes de esta funcionalidad: buscar {@code TODO(PREMIUM-} en el repositorio.
 */
@Service
@Transactional
public class PremiumService {

    private final GroupService groupService;
    private final PremiumSubscriptionRepository subscriptionRepository;

    @Autowired
    PremiumService(GroupService groupService, PremiumSubscriptionRepository subscriptionRepository) {
        this.groupService = groupService;
        this.subscriptionRepository = subscriptionRepository;
    }

    /**
     * Cualquier miembro activo puede suscribir al grupo. Con el lock del grupo, dos suscripciones simultáneas no pueden
     * activarlo dos veces. La prueba gratuita se otorga solo si el grupo nunca tuvo una y el usuario todavía no
     * consumió la suya en ningún grupo; si no, la suscripción se crea igual pero sin prueba. Un grupo que canceló
     * reactiva su suscripción anterior (ver {@link PremiumSubscription#resume}).
     */
    PremiumSubscriptionDTO subscribe(Long groupId, PremiumSubscribeDTO data, String callerEmail) throws ItemNotFoundException {
        GroupMember member = groupService.requireActiveMember(groupId, callerEmail);
        Group group = groupService.requireGroupForUpdate(groupId);

        if (group.isPremium()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The group is already premium");
        }

        User payer = member.getUser();
        PaymentCard card = PaymentCard.from(data, AppTime.today());
        Optional<PremiumSubscription> previous = subscriptionRepository.findByGroup_Id(groupId);
        boolean withTrial = isTrialAvailable(previous, payer);

        PremiumSubscription subscription;
        if (previous.isPresent()) {
            subscription = previous.get();
            subscription.resume(payer, card, withTrial);
        } else {
            subscription = subscriptionRepository.save(PremiumSubscription.start(group, payer, card, withTrial));
        }
        group.activatePremium();
        return PremiumSubscriptionDTO.from(subscription);
    }

    /**
     * Cancela la suscripción del grupo, con efecto inmediato: el grupo deja de ser premium. Cualquier miembro activo
     * puede hacerlo, igual que contratarla. La prueba gratuita consumida no se recupera, y las votaciones de
     * configuración ya abiertas siguen pudiendo votarse y ejecutarse (solo se bloquea abrir nuevas).
     */
    PremiumSubscriptionDTO cancel(Long groupId, String callerEmail) throws ItemNotFoundException {
        groupService.requireActiveMember(groupId, callerEmail);
        Group group = groupService.requireGroupForUpdate(groupId);

        if (!group.isPremium()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The group is not premium");
        }

        PremiumSubscription subscription = subscriptionRepository.findByGroup_Id(groupId)
                .orElseThrow(() -> new IllegalStateException("The premium group has no subscription"));
        subscription.cancel();
        group.deactivatePremium();
        return PremiumSubscriptionDTO.from(subscription);
    }

    /**
     * Le dice al frontend si, al suscribir este grupo, al caller le corresponde la prueba gratuita, para que el formulario
     * no la prometa cuando no va a haberla. Aplica la misma regla que {@link #subscribe}. Solo lectura, y como al
     * suscribir, solo para miembros activos (404 para el resto).
     */
    @Transactional(readOnly = true)
    PremiumEligibilityDTO eligibility(Long groupId, String callerEmail) throws ItemNotFoundException {
        GroupMember member = groupService.requireActiveMember(groupId, callerEmail);

        if (member.getGroup().isPremium()) {
            return new PremiumEligibilityDTO(false);
        }
        return new PremiumEligibilityDTO(
                isTrialAvailable(subscriptionRepository.findByGroup_Id(groupId), member.getUser())
        );
    }

    /** La prueba gratuita es una por grupo (aunque cancele y vuelva) y una por usuario (en cualquier grupo). */
    private boolean isTrialAvailable(Optional<PremiumSubscription> groupSubscription, User payer) {
        boolean groupHadTrial = groupSubscription.map(PremiumSubscription::hasTrial).orElse(false);
        return !groupHadTrial && !subscriptionRepository.existsByTrialUserId(payer.getId());
    }
}
