package EsNuestro.vote;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.expense.Expense;
import EsNuestro.expense.ExpenseDetails;
import EsNuestro.expense.ExpenseService;
import EsNuestro.expense.dtos.ExpenseDataDTO;
import EsNuestro.group.Group;
import EsNuestro.group.GroupService;
import EsNuestro.group.GroupSettings;
import EsNuestro.group.MemberJoinedEvent;
import EsNuestro.group.MemberLeftEvent;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import EsNuestro.reservation.CancellationRequest;
import EsNuestro.reservation.CancellationRequestedEvent;
import EsNuestro.reservation.ReservationCancelledEvent;
import EsNuestro.vote.dtos.ConfigChangeDTO;
import EsNuestro.vote.dtos.VoteDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Casos de uso de votaciones. Toda operación que modifica estado toma primero el lock del grupo (el mismo
 * orden que {@code ExpenseService}), que serializa las votaciones del grupo con los demás cambios de
 * miembros, porcentajes y gastos. Cuando el resultado de una votación queda determinado se finaliza y se
 * ejecuta en la misma transacción que el voto que la resolvió.
 */
@Service
@Transactional
class VoteService {

    private static final int MAX_FAILURE_REASON_LENGTH = 300;

    private final VoteRepository voteRepository;
    private final GroupService groupService;
    private final ExpenseService expenseService;
    private final Map<VoteType, VoteExecutor> executors = new EnumMap<>(VoteType.class);

    @Autowired
    VoteService(
            VoteRepository voteRepository,
            GroupService groupService,
            ExpenseService expenseService,
            List<VoteExecutor> voteExecutors
    ) {
        this.voteRepository = voteRepository;
        this.groupService = groupService;
        this.expenseService = expenseService;
        voteExecutors.forEach(executor -> executors.put(executor.type(), executor));
    }

    /**
     * Abre la votación de un gasto que alcanza el umbral extraordinario. Vota el acreedor y los participantes;
     * quien lo propone es siempre el acreedor, así que su voto "sí" es automático (y sin participantes la
     * votación se resuelve en el acto).
     */
    VoteDTO createExtraordinaryExpenseVote(Long groupId, ExpenseDataDTO data, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember proposer = groupService.requireActiveMember(groupId, username);
        groupService.requireRunning(group);

        ExpenseDetails details = expenseService.buildDetails(groupId, proposer, data);
        GroupSettings settings = group.getSettings();
        if (!settings.isExtraordinary(details.getTotalAmount())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The expense does not reach the extraordinary threshold; register it as a regular expense"
            );
        }

        VotingModel votingModel = settings.getVotingModel();
        ExtraordinaryExpenseVote vote = new ExtraordinaryExpenseVote(group, proposer, votingModel, details);
        involvedMembers(details).forEach(member -> vote.addBallot(member, weightOf(votingModel, member)));
        vote.ballotOf(proposer).ifPresent(ballot -> ballot.cast(VoteChoice.YES));
        voteRepository.save(vote);

        evaluate(vote);
        return VoteDTO.from(vote, proposer);
    }

    /**
     * Abre la votación para cambiar una configuración del grupo. Siempre es unánime: votan todos los miembros
     * activos al momento de proponerla (el padrón queda fijo) y el voto "sí" de quien propone es automático, así
     * que con un único miembro activo el cambio se aplica en el acto. Se rechaza lo que no cambiaría nada, lo que
     * dejaría la configuración incoherente y una segunda propuesta activa sobre la misma configuración.
     */
    VoteDTO createConfigChangeVote(Long groupId, ConfigChangeDTO data, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember proposer = groupService.requireActiveMember(groupId, username);
        groupService.requireRunning(group);

        ConfigChangeVote vote = buildConfigChangeVote(group, proposer, data);
        GroupSettings current = group.getSettings();
        if (vote.changesNothingIn(current)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The proposed value is already the group's current setting"
            );
        }
        try {
            vote.applyTo(current);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        requireNoActiveConfigChange(groupId, vote.getSetting());

        group.getMembers().stream()
                .filter(GroupMember::isActive)
                .forEach(member -> vote.addBallot(member, BigDecimal.ONE));
        vote.ballotOf(proposer).ifPresent(ballot -> ballot.cast(VoteChoice.YES));
        voteRepository.save(vote);

        evaluate(vote);
        return VoteDTO.from(vote, proposer);
    }

    /**
     * Abre la votación para modificar un gasto aprobado (un reporte). Votan el acreedor, los participantes actuales y
     * los propuestos (quien se suma al gasto también vota); el voto "sí" de quien propone es automático si está
     * entre ellos. El gasto queda bloqueado hasta que la votación finalice. Se rechaza una propuesta que no cambiaría
     * nada. El acreedor del gasto no cambia.
     */
    VoteDTO createExpenseEditVote(Long groupId, Long expenseId, ExpenseDataDTO data, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember proposer = groupService.requireActiveMember(groupId, username);
        groupService.requireRunning(group);

        Expense expense = expenseService.requireExpenseForReport(groupId, expenseId, proposer);
        ExpenseDetails proposed = expenseService.buildDetailsForReport(groupId, expense, data);
        if (proposed.sameContentAs(expense.getDetails())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The proposed data are the same as the expense's current data"
            );
        }

        VotingModel votingModel = group.getSettings().getVotingModel();
        ExpenseReportVote vote = ExpenseReportVote.ofEdit(group, proposer, votingModel, expense, proposed);
        return openExpenseReport(vote, expense, proposer, votingModel, involvedMembers(expense.getDetails(), proposed));
    }

    /**
     * Abre la votación para eliminar un gasto aprobado (un reporte). Votan el acreedor y los participantes; el voto
     * "sí" de quien propone es automático. El gasto queda bloqueado hasta que la votación finalice. Si se aprueba, el
     * gasto se elimina lógicamente y quien ya había pagado queda con una devolución a favor.
     */
    VoteDTO createExpenseDeletionVote(Long groupId, Long expenseId, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember proposer = groupService.requireActiveMember(groupId, username);
        groupService.requireRunning(group);

        Expense expense = expenseService.requireExpenseForReport(groupId, expenseId, proposer);

        VotingModel votingModel = group.getSettings().getVotingModel();
        ExpenseReportVote vote = ExpenseReportVote.ofDeletion(group, proposer, votingModel, expense);
        return openExpenseReport(vote, expense, proposer, votingModel, involvedMembers(expense.getDetails()));
    }

    /**
     * El gasto se bloquea antes de evaluar: si la votación se resuelve en el acto (p. ej. el acreedor es el único
     * involucrado), el ejecutor lo desbloquea al terminar.
     */
    private VoteDTO openExpenseReport(
            ExpenseReportVote vote, Expense expense, GroupMember proposer, VotingModel votingModel, List<GroupMember> involved
    ) {
        involved.forEach(member -> vote.addBallot(member, weightOf(votingModel, member)));
        vote.ballotOf(proposer).ifPresent(ballot -> ballot.cast(VoteChoice.YES));
        expense.lockForReport();
        voteRepository.save(vote);

        evaluate(vote);
        return VoteDTO.from(vote, proposer);
    }

    /** Votaciones activas visibles para el caller. Las finalizadas no se listan, pero quedan guardadas. */
    List<VoteDTO> listActiveVotes(Long groupId, String username, VoteType type) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);

        return voteRepository.findByGroup_IdAndStatusOrderByCreatedAtDesc(groupId, VoteStatus.ACTIVE).stream()
                .filter(vote -> type == null || vote.getType() == type)
                .filter(vote -> vote.isVisibleTo(caller))
                .map(vote -> VoteDTO.from(vote, caller))
                .toList();
    }

    /** Emite o cambia el voto del caller mientras la votación esté activa. */
    VoteDTO castBallot(Long groupId, Long voteId, VoteChoice choice, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember caller = groupService.requireActiveMember(groupId, username);
        // Con el grupo detenido nada se resuelve: así una votación aprobada no se ejecuta sobre porcentajes en flujo.
        groupService.requireRunning(group);
        Vote vote = requireVote(groupId, voteId);

        if (!vote.isVisibleTo(caller)) {
            throw new ItemNotFoundException("vote", voteId);
        }
        if (!vote.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The vote is already finalized");
        }
        Ballot ballot = vote.ballotOf(caller)
                .orElseThrow(() -> new AccessDeniedException("You are not one of the members involved in this vote"));

        ballot.cast(choice);
        evaluate(vote);
        return VoteDTO.from(vote, caller);
    }

    /**
     * Quien deja el grupo deja de contar en sus votaciones activas, lo que puede dejar su resultado
     * determinado. Corre en la transacción de {@code GroupService.leaveGroup}, que ya tiene el lock del grupo.
     */
    @EventListener
    public void onMemberLeft(MemberLeftEvent event) {
        voteRepository.findByGroup_IdAndStatusOrderByCreatedAtDesc(event.groupId(), VoteStatus.ACTIVE).stream()
                .filter(vote -> vote.hasBallotOf(event.memberId()))
                .forEach(this::evaluate);
    }

    /**
     * Un cambio de configuración lo votan todos los miembros activos; quien ingresa mientras hay una abierta pasa
     * a ser parte del padrón y puede votarla (su voto queda pendiente, así que la votación sigue abierta). Las
     * votaciones de gastos no se tocan: involucran solo al acreedor y a los participantes. Corre en la transacción de
     * {@code GroupService.approveJoinRequest}, que ya tiene el lock del grupo.
     */
    @EventListener
    public void onMemberJoined(MemberJoinedEvent event) {
        GroupMember member = event.member();
        voteRepository.findByGroup_IdAndStatusOrderByCreatedAtDesc(event.groupId(), VoteStatus.ACTIVE).stream()
                .filter(vote -> vote instanceof ConfigChangeVote)
                .filter(vote -> !vote.hasBallotOf(member.getId()))
                .forEach(vote -> vote.addBallot(member, BigDecimal.ONE));
    }

    /**
     * Un reclamo sobre una reserva abre su votación. Votan los miembros activos (el padrón queda fijo)
     * con el modelo de votación del grupo, y el voto "sí" de quien reclama es automático.
     * Corre en la transacción de {@code ReservationService.requestCancellation}, que ya tiene el lock del grupo.
     */
    @EventListener
    public void onCancellationRequested(CancellationRequestedEvent event) {
        CancellationRequest request = event.request();
        Group group = request.getReservation().getGroup();
        GroupMember claimant = request.getRequester();

        VotingModel votingModel = group.getSettings().getVotingModel();
        ReservationClaimVote vote = new ReservationClaimVote(group, claimant, votingModel, request);
        group.getMembers().stream()
                .filter(GroupMember::isActive)
                .forEach(member -> vote.addBallot(member, weightOf(votingModel, member)));
        vote.ballotOf(claimant).ifPresent(ballot -> ballot.cast(VoteChoice.YES));
        voteRepository.save(vote);

        evaluate(vote);
    }

    /**
     * Si el dueño cancela su reserva, los reclamos abiertos sobre ella dejan de tener sentido: se cierran y la
     * solicitud queda rechazada. Corre en la transacción de {@code ReservationService.cancelOwnReservation}, que ya
     * tiene el lock del grupo.
     */
    @EventListener
    public void onReservationCancelled(ReservationCancelledEvent event) {
        for (Vote vote : voteRepository.findByGroup_IdAndStatusOrderByCreatedAtDesc(event.groupId(), VoteStatus.ACTIVE)) {
            if (vote instanceof ReservationClaimVote claim
                    && claim.getCancellationRequest().getReservation().getId().equals(event.reservationId())) {
                claim.getCancellationRequest().reject();
                claim.finalizeWith(VoteOutcome.EXECUTION_FAILED, "The reservation was canceled by its owner");
            }
        }
    }

    private ConfigChangeVote buildConfigChangeVote(Group group, GroupMember proposer, ConfigChangeDTO data) {
        return switch (data.setting()) {
            case DISTRIBUTION_MODE -> ConfigChangeVote.ofDistributionMode(group, proposer, data.distributionMode());
            case VOTING_MODEL -> ConfigChangeVote.ofVotingModel(group, proposer, data.votingModel());
            case RESERVATION_LIMIT_POLICY -> ConfigChangeVote.ofReservationLimit(
                    group, proposer, data.reservationLimitPolicy(), data.reservationFixedDaysPerMonth()
            );
            case EXTRAORDINARY_EXPENSE_THRESHOLD -> ConfigChangeVote.ofExtraordinaryExpenseThreshold(
                    group, proposer, data.extraordinaryExpenseThreshold()
            );
        };
    }

    private void requireNoActiveConfigChange(Long groupId, ConfigSetting setting) {
        boolean alreadyProposed = voteRepository
                .findByGroup_IdAndStatusOrderByCreatedAtDesc(groupId, VoteStatus.ACTIVE).stream()
                .anyMatch(active -> active instanceof ConfigChangeVote change && change.getSetting() == setting);
        if (alreadyProposed) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "There is already an active vote to change this setting"
            );
        }
    }

    private void evaluate(Vote vote) {
        VoteTally.Result result = VoteTally.evaluate(vote.getVotingModel(), vote.tallyEntries());
        switch (result) {
            case OPEN -> {
            }
            case REJECTED -> {
                VoteExecutor executor = executors.get(vote.getType());
                if (executor != null) {
                    executor.onRejected(vote);
                }
                vote.finalizeWith(VoteOutcome.REJECTED, null);
            }
            case APPROVED -> executeApproved(vote);
        }
    }

    private void executeApproved(Vote vote) {
        VoteExecutor executor = executors.get(vote.getType());
        Optional<String> failure = executor == null
                ? Optional.of("Votes of type " + vote.getType() + " cannot be executed yet")
                : executor.execute(vote);

        if (failure.isPresent()) {
            vote.finalizeWith(VoteOutcome.EXECUTION_FAILED, truncate(failure.get()));
        } else {
            vote.finalizeWith(VoteOutcome.APPROVED, null);
        }
    }

    /** Acreedor y participantes de cada uno de los datos recibidos, sin repetidos y en orden. */
    private List<GroupMember> involvedMembers(ExpenseDetails... detailsList) {
        Map<Long, GroupMember> byId = new LinkedHashMap<>();
        for (ExpenseDetails details : detailsList) {
            byId.putIfAbsent(details.getCreditor().getId(), details.getCreditor());
            details.getParticipants().forEach(participant ->
                    byId.putIfAbsent(participant.getMember().getId(), participant.getMember()));
        }
        return List.copyOf(byId.values());
    }

    /** El peso solo cuenta en la mayoría ponderada; se fija ahora y no cambia si luego cambian los porcentajes. */
    private BigDecimal weightOf(VotingModel votingModel, GroupMember member) {
        if (votingModel != VotingModel.OWNERSHIP_WEIGHTED_MAJORITY) {
            return BigDecimal.ONE;
        }
        return member.getPercentage() == null ? BigDecimal.ZERO : member.getPercentage();
    }

    private Vote requireVote(Long groupId, Long voteId) throws ItemNotFoundException {
        Vote vote = voteRepository.findById(voteId)
                .orElseThrow(() -> new ItemNotFoundException("vote", voteId));
        if (!vote.getGroup().getId().equals(groupId)) {
            throw new ItemNotFoundException("vote", voteId);
        }
        return vote;
    }

    private String truncate(String text) {
        return text.length() <= MAX_FAILURE_REASON_LENGTH ? text : text.substring(0, MAX_FAILURE_REASON_LENGTH);
    }
}
