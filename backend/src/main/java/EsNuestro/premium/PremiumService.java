package EsNuestro.premium;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.common.time.AppTime;
import EsNuestro.group.Group;
import EsNuestro.group.GroupService;
import EsNuestro.member.GroupMember;
import EsNuestro.premium.dtos.PremiumSubscribeDTO;
import EsNuestro.premium.dtos.PremiumSubscriptionDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
     * activarlo dos veces. La prueba gratuita se otorga solo si el usuario todavía no consumió la suya en ningún grupo
     * (la del grupo está garantizada: tiene a lo sumo una suscripción); si ya la consumió, la suscripción se crea igual
     * pero sin prueba.
     */
    PremiumSubscriptionDTO subscribe(Long groupId, PremiumSubscribeDTO data, String callerEmail) throws ItemNotFoundException {
        GroupMember payer = groupService.requireActiveMember(groupId, callerEmail);
        Group group = groupService.requireGroupForUpdate(groupId);

        if (group.isPremium()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The group is already premium");
        }

        PaymentCard card = PaymentCard.from(data, AppTime.today());
        boolean withTrial = !subscriptionRepository.existsByTrialUserId(payer.getUser().getId());

        PremiumSubscription subscription = subscriptionRepository.save(
                PremiumSubscription.start(group, payer.getUser(), card, withTrial)
        );
        group.activatePremium();
        return PremiumSubscriptionDTO.from(subscription);
    }

    // TODO(PREMIUM-CANCELLATION): cancelar la suscripción de un grupo. No está implementado a propósito. Tiene que:
    //  apagar el premium del grupo (Group.deactivatePremium), cerrar la PremiumSubscription, cortar la facturación y
    //  definir quién puede cancelar (hoy cualquier miembro activo puede contratar). Ver también el re-suscribir en
    //  PremiumSubscription.

    // TODO(PREMIUM-TRIAL-ELIGIBILITY): el frontend no puede saber de antemano si le corresponde la prueba gratuita
    //  (PremiumApplicationScreen siempre ofrece "prueba gratuita"). Exponer algo como GET /groups/{id}/premium/eligibility
    //  o un campo en el usuario, para ajustar el texto del formulario antes de enviarlo.
}
