package EsNuestro.premium;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.common.time.AppTime;
import EsNuestro.group.Group;
import EsNuestro.group.GroupService;
import EsNuestro.group.MemberLeftEvent;
import EsNuestro.group.PremiumEndedEvent;
import EsNuestro.group.dtos.GroupDTO;
import EsNuestro.member.GroupMember;
import EsNuestro.member.GroupMemberRepository;
import EsNuestro.premium.dtos.PremiumEligibilityDTO;
import EsNuestro.premium.dtos.PremiumGroupCreateDTO;
import EsNuestro.premium.dtos.PremiumNoticeDTO;
import EsNuestro.premium.dtos.PremiumPlanDTO;
import EsNuestro.premium.dtos.PremiumStatusDTO;
import EsNuestro.premium.dtos.PremiumSubscribeDTO;
import EsNuestro.premium.dtos.PremiumSubscriptionDTO;
import EsNuestro.user.User;
import EsNuestro.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Suscripción de grupos al plan premium. El pago es simulado: se validan y registran los datos del formulario como
 * base de la facturación mensual, sin pasarela externa ni cobro real (ver {@link PaymentCard} y
 * {@link PremiumBillingJob}).
 * <p>
 * Reglas (cualquier miembro activo puede contratar, mejorar y cancelar, sin votación):
 * <ul>
 *   <li>La prueba gratuita dura {@value PremiumSubscription#TRIAL_DAYS} días y es una por grupo y una por usuario. Al
 *   terminar se debita el primer mes; si el débito falla, el grupo vuelve al plan gratuito y la prueba no se repone.</li>
 *   <li>Cancelar una prueba la termina en el acto. Cancelar un plan pago detiene la renovación pero el grupo lo
 *   conserva hasta el fin del período pagado, sin reembolso.</li>
 *   <li>Mejorar durante la prueba la corta y empieza el plan pago en el acto. Mejorar un plan cancelado todavía vigente
 *   no cobra nada hasta la próxima renovación, que pasa a la tarjeta nueva.</li>
 *   <li>Un pago rechazado al activar o mejorar no cambia nada.</li>
 *   <li>Cuando el grupo deja de ser premium sus configuraciones vuelven a los valores por defecto y se cierran sin
 *   aplicar las votaciones de configuración abiertas (ver {@link Group#deactivatePremium()}).</li>
 *   <li>Cada hecho deja un {@link PremiumNotice} que los demás miembros ven al entrar.</li>
 * </ul>
 */
@Service
@Transactional
public class PremiumService {

    /** Precio mensual del plan, sin impuestos. */
    public static final BigDecimal MONTHLY_PRICE = new BigDecimal("4499");

    /** Con cuántos días de anticipación se avisa que la prueba está por terminar. */
    static final int TRIAL_REMINDER_DAYS = 2;

    private final GroupService groupService;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PremiumSubscriptionRepository subscriptionRepository;
    private final PremiumNoticeRepository noticeRepository;
    private final PremiumNoticeReadRepository noticeReadRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    PremiumService(
            GroupService groupService,
            UserRepository userRepository,
            GroupMemberRepository groupMemberRepository,
            PremiumSubscriptionRepository subscriptionRepository,
            PremiumNoticeRepository noticeRepository,
            PremiumNoticeReadRepository noticeReadRepository,
            ApplicationEventPublisher eventPublisher
    ) {
        this.groupService = groupService;
        this.userRepository = userRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.noticeRepository = noticeRepository;
        this.noticeReadRepository = noticeReadRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Contrata, mejora o reactiva el plan según el estado del grupo. Con el lock del grupo, dos suscripciones
     * simultáneas no pueden activarlo dos veces.
     * <ul>
     *   <li>Sin premium: activa el plan. Con prueba si al grupo y al usuario les corresponde; si no, cobra el primer mes
     *   en el acto (si la tarjeta es rechazada no cambia nada). Un grupo cuya suscripción terminó la retoma.</li>
     *   <li>En prueba: la mejora al plan pago en el acto (también se cobra en el acto).</li>
     *   <li>Cancelado pero vigente: lo reactiva con la tarjeta nueva, sin cobrar hasta la próxima renovación.</li>
     *   <li>Premium pago activo: 409.</li>
     * </ul>
     */
    PremiumSubscriptionDTO subscribe(Long groupId, PremiumSubscribeDTO data, String callerEmail) throws ItemNotFoundException {
        GroupMember member = groupService.requireActiveMember(groupId, callerEmail);
        Group group = groupService.requireGroupForUpdate(groupId);

        User payer = member.getUser();
        PaymentCard card = PaymentCard.from(data, AppTime.today());
        Optional<PremiumSubscription> previous = subscriptionRepository.findByGroup_Id(groupId);
        Instant now = Instant.now();

        if (group.isPremium()) {
            return upgradeOrReactivate(group, previous, payer, card, now);
        }

        boolean withTrial = isTrialAvailable(previous, payer);
        if (!withTrial) {
            requireChargeable(card);
        }

        PremiumSubscription subscription;
        if (previous.isPresent()) {
            subscription = previous.get();
            subscription.resume(payer, card, withTrial);
        } else {
            subscription = subscriptionRepository.save(PremiumSubscription.start(group, payer, card, withTrial));
        }
        group.activatePremium();
        notice(group, withTrial ? PremiumNoticeType.TRIAL_STARTED : PremiumNoticeType.PLAN_ACTIVATED, payer, payer,
                withTrial ? subscription.getTrialEndsAt() : subscription.getNextBillingAt());
        return PremiumSubscriptionDTO.from(subscription);
    }

    private PremiumSubscriptionDTO upgradeOrReactivate(
            Group group, Optional<PremiumSubscription> previous, User payer, PaymentCard card, Instant now
    ) {
        PremiumSubscription subscription = previous
                .orElseThrow(() -> new IllegalStateException("The premium group has no subscription"));

        if (subscription.isOnTrial()) {
            requireChargeable(card);
            subscription.upgradeFromTrial(payer, card, now);
            notice(group, PremiumNoticeType.PLAN_UPGRADED, payer, payer, subscription.getNextBillingAt());
            return PremiumSubscriptionDTO.from(subscription);
        }
        if (subscription.isCancelledButInForce(now)) {
            subscription.reactivate(payer, card, now);
            notice(group, PremiumNoticeType.PLAN_REACTIVATED, payer, payer, subscription.getNextBillingAt());
            return PremiumSubscriptionDTO.from(subscription);
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "The group is already premium");
    }

    /**
     * Crea un grupo premium: el grupo (con las configuraciones que quiera) y su suscripción en una sola transacción. Si
     * el pago es rechazado no se crea nada. La prueba gratuita se otorga si al usuario le corresponde (el grupo es
     * nuevo, así que no tuvo ninguna).
     */
    GroupDTO createPremiumGroup(PremiumGroupCreateDTO data, String callerEmail) throws ItemNotFoundException {
        GroupDTO created = groupService.createGroupAllowingCustomSettings(data.group(), callerEmail);
        subscribe(created.id(), data.payment(), callerEmail);

        GroupMember founder = groupService.requireActiveMember(created.id(), callerEmail);
        return GroupDTO.from(founder.getGroup(), founder);
    }

    /**
     * Cancela la suscripción del grupo. Una prueba no se puede volver a activar. Tanto una prueba como un plan pago
     * deja de renovarse y el grupo lo conserva hasta el fin del período ya pagado, sin reembolso.
     * Cualquier miembro activo puede hacerlo, igual que contratarlo.
     */
    PremiumSubscriptionDTO cancel(Long groupId, String callerEmail) throws ItemNotFoundException {
        GroupMember member = groupService.requireActiveMember(groupId, callerEmail);
        Group group = groupService.requireGroupForUpdate(groupId);

        if (!group.isPremium()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The group is not premium");
        }
        PremiumSubscription subscription = subscriptionRepository.findByGroup_Id(groupId)
                .orElseThrow(() -> new IllegalStateException("The premium group has no subscription"));
        if (!subscription.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The premium plan is already cancelled");
        }

        cancelSubscription(group, subscription, member.getUser());
        return PremiumSubscriptionDTO.from(subscription);
    }

    /**
     * Si quien abandona el grupo es el pagador de una suscripción activa, se cancela automáticamente (con las mismas reglas
     * que {@link #cancel}). Si la suscripción ya estaba cancelada, o la pagó otro miembro, no se toca. Corre en la
     * transacción de {@code GroupService.leaveGroup}, que ya tiene el lock del grupo.
     */
    @EventListener
    public void onMemberLeft(MemberLeftEvent event) {
        GroupMember member = groupMemberRepository.findById(event.memberId()).orElse(null);
        if (member == null) {
            return;
        }
        subscriptionRepository.findByGroup_Id(event.groupId())
                .filter(PremiumSubscription::isActive)
                .filter(subscription -> subscription.getPayer().getId().equals(member.getUser().getId()))
                .ifPresent(subscription -> cancelSubscription(member.getGroup(), subscription, member.getUser()));
    }

    /** Cancela una suscripción activa y deja el aviso para los demás miembros. */
    private void cancelSubscription(Group group, PremiumSubscription subscription, User actor) {
        subscription.cancel(Instant.now());
        notice(group, subscription.isOnTrial() ? PremiumNoticeType.TRIAL_CANCELLED : PremiumNoticeType.PLAN_CANCELLED,
                actor, subscription.getPayer(), subscription.getEndsAt());
    }

    /** Oferta del plan (precio y días de prueba): no depende de ningún grupo ni usuario. */
    PremiumPlanDTO plan() {
        return new PremiumPlanDTO(MONTHLY_PRICE, PremiumSubscription.TRIAL_DAYS);
    }

    /**
     * Estado del plan del grupo para cualquier miembro activo: qué ofrece el navbar, qué muestra el dashboard y si el
     * caller puede cancelar. Solo lectura.
     */
    @Transactional(readOnly = true)
    PremiumStatusDTO status(Long groupId, String callerEmail) throws ItemNotFoundException {
        GroupMember member = groupService.requireActiveMember(groupId, callerEmail);
        Group group = member.getGroup();
        Optional<PremiumSubscription> subscription = subscriptionRepository.findByGroup_Id(groupId);
        Instant now = Instant.now();

        PremiumState state = stateOf(group, subscription.orElse(null));
        boolean trialAvailable = !group.isPremium() && isTrialAvailable(subscription, member.getUser());
        if (subscription.isEmpty()) {
            return new PremiumStatusDTO(state, group.isPremium(), trialAvailable, null, null, null, null, null, null,
                    false, null, null, null, MONTHLY_PRICE, PremiumSubscription.TRIAL_DAYS);
        }

        PremiumSubscription sub = subscription.get();
        boolean onTrial = state == PremiumState.TRIAL;
        Integer trialDaysLeft = onTrial ? daysLeft(now, sub.getTrialEndsAt()) : null;
        boolean inForce = state != PremiumState.NEVER && state != PremiumState.EXPIRED;
        boolean cancelledInForce = state == PremiumState.CANCELLED_IN_FORCE;
        boolean youArePayer = inForce && sub.getPayer().getId().equals(member.getUser().getId());
        // Datos de la tarjeta: privados del pagador, y solo mientras se le va a seguir cobrando con ella.
        boolean showCard = youArePayer && !cancelledInForce;
        String payerNickname = inForce
                ? groupMemberRepository.findByGroup_IdAndUser_Id(groupId, sub.getPayer().getId())
                        .map(GroupMember::getNickname)
                        .orElse(null)
                : null;
        Instant countdownEnd = cancelledInForce ? sub.getEndsAt() : (inForce ? sub.getNextBillingAt() : null);
        return new PremiumStatusDTO(
                state,
                group.isPremium(),
                trialAvailable,
                onTrial ? sub.getTrialEndsAt() : null,
                trialDaysLeft,
                sub.isActive() && inForce ? sub.getNextBillingAt() : null,
                cancelledInForce ? sub.getEndsAt() : null,
                inForce ? sub.getPayer().getName() : null,
                payerNickname,
                youArePayer,
                showCard ? sub.getCardLast4() : null,
                showCard ? sub.getCardholderName() : null,
                countdownEnd == null ? null : wholeDaysLeft(now, countdownEnd),
                MONTHLY_PRICE,
                PremiumSubscription.TRIAL_DAYS
        );
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

    /** Elegibilidad para un grupo que todavía no existe: solo depende de si el usuario ya consumió su prueba. */
    @Transactional(readOnly = true)
    PremiumEligibilityDTO eligibilityForNewGroup(String callerEmail) {
        User user = requireUser(callerEmail);
        return new PremiumEligibilityDTO(!subscriptionRepository.existsByTrialUserId(user.getId()));
    }

    /**
     * Avisos premium que el caller todavía no vio: los posteriores a la última vez que los marcó como vistos (o a su
     * ingreso al grupo), sin los que provocó él mismo. Solo lectura: se marcan con {@link #markNoticesSeen}.
     */
    @Transactional(readOnly = true)
    List<PremiumNoticeDTO> pendingNotices(Long groupId, String callerEmail) throws ItemNotFoundException {
        GroupMember member = groupService.requireActiveMember(groupId, callerEmail);
        Long userId = member.getUser().getId();

        Instant since = noticeReadRepository.findByUserIdAndGroupId(userId, groupId)
                .map(PremiumNoticeRead::getLastSeenAt)
                .orElse(member.getJoinedAt() == null ? Instant.EPOCH : member.getJoinedAt());

        return noticeRepository.findByGroup_IdAndOccurredAtAfterOrderByOccurredAtAsc(groupId, since).stream()
                .filter(notice -> !userId.equals(notice.getActorUserId()))
                .map(notice -> new PremiumNoticeDTO(
                        notice.getId(),
                        notice.getType(),
                        notice.getActorName(),
                        notice.getPayerName(),
                        userId.equals(notice.getPayerUserId()),
                        notice.getUntil(),
                        notice.getOccurredAt()
                ))
                .toList();
    }

    /** Marca como vistos los avisos premium del grupo hasta este momento. */
    void markNoticesSeen(Long groupId, String callerEmail) throws ItemNotFoundException {
        GroupMember member = groupService.requireActiveMember(groupId, callerEmail);
        Long userId = member.getUser().getId();
        Instant now = Instant.now();

        noticeReadRepository.findByUserIdAndGroupId(userId, groupId).ifPresentOrElse(
                read -> read.seenUntil(now),
                () -> noticeReadRepository.save(new PremiumNoticeRead(userId, groupId, now))
        );
    }

    /**
     * Lo que corresponde hacer con un grupo en este momento; lo invoca {@link PremiumBillingJob}, una transacción por
     * grupo y con el lock del grupo, y es idempotente.
     * <ul>
     *   <li>Le toca cobrar (fin de la prueba o renovación): si la tarjeta es rechazada el grupo vuelve al plan gratuito;
     *   si no, se registra el cobro.</li>
     *   <li>Plan cancelado cuyo período pagado terminó: el grupo vuelve al plan gratuito.</li>
     *   <li>Prueba que termina en menos de {@value #TRIAL_REMINDER_DAYS} días: se avisa a todos, una sola vez.</li>
     * </ul>
     */
    void processGroup(Long groupId, Instant now) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        PremiumSubscription subscription = subscriptionRepository.findByGroup_Id(groupId).orElse(null);
        if (subscription == null) {
            return;
        }

        if (subscription.isActive() && !subscription.getNextBillingAt().isAfter(now)) {
            collect(group, subscription, now);
        } else if (!subscription.isActive() && group.isPremium()
                && subscription.getEndsAt() != null && !subscription.getEndsAt().isAfter(now)) {
            endPremium(group);
            notice(group, PremiumNoticeType.PLAN_ENDED, null, subscription.getPayer(), subscription.getEndsAt());
        } else if (subscription.isOnTrial() && subscription.getTrialReminderSentAt() == null
                && !subscription.getTrialEndsAt().isAfter(now.plus(TRIAL_REMINDER_DAYS, ChronoUnit.DAYS))) {
            subscription.markTrialReminderSent(now);
            notice(group, PremiumNoticeType.TRIAL_ENDING, null, subscription.getPayer(), subscription.getTrialEndsAt());
        }
    }

    private void collect(Group group, PremiumSubscription subscription, Instant now) {
        boolean wasTrial = subscription.isOnTrial();
        if (subscription.isCardDeclines()) {
            subscription.failPayment(now);
            endPremium(group);
            notice(group, PremiumNoticeType.PAYMENT_FAILED, null, subscription.getPayer(), null);
            return;
        }
        subscription.registerCharge();
        if (wasTrial) {
            notice(group, PremiumNoticeType.TRIAL_CONVERTED, null, subscription.getPayer(), subscription.getNextBillingAt());
        }
    }

    /** El grupo deja de ser premium: vuelve a las configuraciones por defecto y se cierran las votaciones pendientes. */
    private void endPremium(Group group) {
        group.deactivatePremium();
        eventPublisher.publishEvent(new PremiumEndedEvent(group.getId()));
    }

    private void notice(Group group, PremiumNoticeType type, User actor, User payer, Instant until) {
        noticeRepository.save(new PremiumNotice(group, type, actor, payer, until));
    }

    /** Simulación del cobro: la tarjeta de prueba que la pasarela rechaza siempre falla con 402 y no cambia nada. */
    private void requireChargeable(PaymentCard card) {
        if (card.declines()) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "The card was declined");
        }
    }

    private PremiumState stateOf(Group group, PremiumSubscription subscription) {
        if (subscription == null) {
            return group.isPremium() ? PremiumState.ACTIVE : PremiumState.NEVER;
        }
        if (!group.isPremium()) {
            return PremiumState.EXPIRED;
        }
        if (subscription.isOnTrial()) {
            return PremiumState.TRIAL;
        }
        return subscription.isActive() ? PremiumState.ACTIVE : PremiumState.CANCELLED_IN_FORCE;
    }

    /** Días que faltan, redondeados hacia arriba: con 1 hora de prueba por delante todavía "queda 1 día". */
    private int daysLeft(Instant now, Instant end) {
        long hours = Math.max(Duration.between(now, end).toHours(), 0);
        return (int) Math.ceil(hours / 24.0);
    }

    /** Días completos que faltan (0 = menos de un día); a diferencia de {@link #daysLeft}, no redondea hacia arriba. */
    private int wholeDaysLeft(Instant now, Instant end) {
        return (int) Math.max(Duration.between(now, end).toDays(), 0);
    }

    /** La prueba gratuita es una por grupo (aunque cancele y vuelva) y una por usuario (en cualquier grupo). */
    private boolean isTrialAvailable(Optional<PremiumSubscription> groupSubscription, User payer) {
        boolean groupHadTrial = groupSubscription.map(PremiumSubscription::hasTrial).orElse(false);
        return !groupHadTrial && !subscriptionRepository.existsByTrialUserId(payer.getId());
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
