package EsNuestro.expense;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.expense.dtos.ExpenseDTO;
import EsNuestro.expense.dtos.ExpenseDataDTO;
import EsNuestro.expense.dtos.ExpenseParticipantDTO;
import EsNuestro.expense.dtos.DebtDTO;
import EsNuestro.expense.dtos.PaymentDataDTO;
import EsNuestro.group.DistributionMode;
import EsNuestro.group.Group;
import EsNuestro.group.GroupService;
import EsNuestro.member.GroupMember;
import EsNuestro.member.GroupMemberRepository;
import EsNuestro.expense.dtos.BalanceByPersonDTO;
import EsNuestro.expense.dtos.GroupSummaryDTO;
import EsNuestro.expense.dtos.ExpenseMemberDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Casos de uso de gastos y deudas. Toda operación que modifica estado toma primero el lock del
 * grupo y luego el del gasto (mismo orden siempre, para evitar deadlocks). Como {@code GroupService}
 * usa ese mismo lock del grupo al cambiar porcentajes o dar de baja miembros, las deudas se
 * calculan siempre sobre miembros y porcentajes estables, y la resolución de un gasto es atómica.
 */
@Service
@Transactional
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupService groupService;

    @Autowired
    ExpenseService(
            ExpenseRepository expenseRepository,
            GroupMemberRepository groupMemberRepository,
            GroupService groupService
    ) {
        this.expenseRepository = expenseRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupService = groupService;
    }

    /**
     * Un admin lo crea aprobado (con deudas); un miembro regular lo crea pendiente, sin deudas.
     * Un gasto que alcanza el umbral extraordinario del grupo no se crea por acá: se propone como votación
     * (ver {@code VoteService.createExtraordinaryExpenseVote}).
     */
    ExpenseDTO createExpense(Long groupId, ExpenseDataDTO data, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember creator = groupService.requireActiveMember(groupId, username);
        groupService.requireRunning(group);

        ExpenseDetails details = buildDetails(groupId, data);
        requireBelowExtraordinaryThreshold(group, details);

        // Expense expense = Expense.register(creator, details);
        Expense expense = Expense.register(creator, buildDetails(groupId, creator, data));
        // TODO evaluar proceso de approve tiene sentido ahora q no hay admin
        expense.approve(creator);
        return ExpenseDTO.from(expenseRepository.save(expense));
    }

    /** Admin: ve todos. Resto: solo los gastos en los que está involucrado. */
    List<ExpenseDTO> listExpenses(Long groupId, String username, ExpenseStatus status) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);

        return expenseRepository.findByGroup_IdOrderByCreatedAtDesc(groupId).stream()
                .filter(expense -> status == null || expense.getStatus() == status)
                .filter(expense -> expense.isInvolved(caller))
                .map(ExpenseDTO::from)
                .toList();
    }

    ExpenseDTO getExpense(Long groupId, Long expenseId, String username) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);
        Expense expense = requireExpense(groupId, expenseId);
        if (!expense.isInvolved(caller)) {
            throw new AccessDeniedException("You don't have access to this expense");
        }
        return ExpenseDTO.from(expense);
    }

    /**
     * Edita un gasto aprobado y sin pagos. Si edita un admin se aplica directo; si edita el creador
     * (no admin) queda pendiente de aprobación y sus deudas se suspenden hasta la resolución.
     */
    ExpenseDTO updateExpense(Long groupId, Long expenseId, ExpenseDataDTO data, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember acting = groupService.requireActiveMember(groupId, username);
        // Editar vuelve a repartir el gasto con los porcentajes vigentes: no con el grupo detenido, que está en flujo.
        groupService.requireRunning(group);
        Expense expense = requireExpenseForUpdate(groupId, expenseId);

        requireCanManage(expense, acting);
        requireEditable(expense);
        requireNoPayments(expense);

        expense.proposeEdit(buildDetails(groupId, acting, data));
        // TODO(votaciones): agujero conocido. Esta edición puede llevar el monto por encima del umbral
        //  extraordinario sin pasar por votación (se crea un gasto chico y se lo edita después). Se cierra
        //  con el flujo de reportes de gasto (ExpenseReportVote): la edición pasará a ser una votación.
        // expense.proposeEdit(buildDetails(groupId, data));

        // TODO evaluar proceso de approve tiene sentido ahora q no hay admin
        expense.approve(acting);
        return ExpenseDTO.from(expense);
    }

    ExpenseDTO approveExpense(Long groupId, Long expenseId, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember acting = groupService.requireActiveMember(groupId, username);
        // Aprobar genera las deudas con los porcentajes vigentes: no con el grupo detenido.
        groupService.requireRunning(group);
        Expense expense = requireExpenseForUpdate(groupId, expenseId);

        requirePendingApproval(expense);
        // Entre el envío y la aprobación alguien pudo dejar el grupo: no se generan deudas para inactivos.
        requireMembersActive(expense.detailsUnderReview());

        expense.approve(acting);
        return ExpenseDTO.from(expense);
    }

    ExpenseDTO rejectExpense(Long groupId, Long expenseId, String username) throws ItemNotFoundException {
        groupService.requireGroupForUpdate(groupId);
        GroupMember acting = groupService.requireActiveMember(groupId, username);
        Expense expense = requireExpenseForUpdate(groupId, expenseId);

        requirePendingApproval(expense);

        expense.reject(acting);
        return ExpenseDTO.from(expense);
    }

    /**
     * Reenvía un gasto rechazado, con cambios ({@code changes} != null) o sin ellos. Si lo reenvía un
     * admin queda aprobado directo; si no, vuelve a pendiente de aprobación.
     */
    ExpenseDTO resubmitExpense(Long groupId, Long expenseId, ExpenseDataDTO changes, String username) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember acting = groupService.requireActiveMember(groupId, username);
        // Reenviar vuelve a generar las deudas con los porcentajes vigentes: no con el grupo detenido.
        groupService.requireRunning(group);
        Expense expense = requireExpenseForUpdate(groupId, expenseId);

        requireCanManage(expense, acting);
        if (expense.getStatus() != ExpenseStatus.REJECTED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only rejected expenses can be resubmitted, but it was " + expense.getStatus()
            );
        }

        // TODO(votaciones): mismo agujero que en updateExpense: reenviar con cambios puede superar el umbral
        //  extraordinario sin votación. Se cierra con el flujo de reportes de gasto.
        // ExpenseDetails newDetails = changes == null ? null : buildDetails(groupId, changes);
        ExpenseDetails newDetails = changes == null ? null : buildDetails(groupId, acting, changes);
        if (newDetails == null) {
            requireMembersActive(expense.getDetails());
        }

        expense.resubmit(newDetails);
        // TODO evaluar si hay q cambiar el flujo de submit -> approve
        expense.approve(acting);
        return ExpenseDTO.from(expense);
    }

    /**
     * Autodeclara el pago (total o parcial) de una deuda propia. Queda asentado tal cual lo reporta
     * el deudor; la revisión por parte del acreedor o un admin es un módulo futuro, todavía no existe.
     */
    DebtDTO payDebt(Long groupId, Long expenseId, Long debtId, PaymentDataDTO data, String username) throws ItemNotFoundException {
        groupService.requireGroupForUpdate(groupId);
        GroupMember caller = groupService.requireActiveMember(groupId, username);
        Expense expense = requireExpenseForUpdate(groupId, expenseId);
        Debt debt = requireDebtInExpense(expense, debtId);

        requireDebtor(debt, caller);
        requireApproved(expense);
        requireDebtActive(debt);
        BigDecimal amount = requireValidPaymentAmount(debt, data.amount());
        String receiptUrl = requireReceiptUrl(data.receiptUrl());

        debt.registerPayment(amount, receiptUrl);
        return DebtDTO.from(debt);
    }

    /** Solo el creador o un admin, y solo si ninguna deuda tiene pagos. Elimina también sus deudas. */
    void deleteExpense(Long groupId, Long expenseId, String username) throws ItemNotFoundException {
        groupService.requireGroupForUpdate(groupId);
        GroupMember acting = groupService.requireActiveMember(groupId, username);
        Expense expense = requireExpenseForUpdate(groupId, expenseId);

        requireCanManage(expense, acting);
        requireNoPayments(expense);

        expenseRepository.delete(expense);
    }

    /** Resumen del caller en el grupo: cuánto debe, cuánto le deben y pendientes visibles. */
    GroupSummaryDTO summary(Long groupId, String username) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);
        List<Expense> expenses = expenseRepository.findByGroup_IdOrderByCreatedAtDesc(groupId);

        BigDecimal owes = BigDecimal.ZERO;
        BigDecimal owed = BigDecimal.ZERO;
        long pending = 0;

        for (Expense expense : expenses) {
            if (!expense.isInvolved(caller)) {
                continue;
            }
            if (expense.getStatus() == ExpenseStatus.PENDING_APPROVAL) {
                pending++;
                continue;
            }
            if (expense.getStatus() != ExpenseStatus.APPROVED) {
                continue;
            }

            for (Debt debt : expense.getDebts()) {
                if (debt.getStatus() != DebtStatus.ACTIVE || !debt.isUnsettled()) {
                    continue;
                }
                BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
                if (debt.getDebtor().getId().equals(caller.getId())) {
                    owes = owes.add(remaining);
                } else if (debt.getCreditor().getId().equals(caller.getId())) {
                    owed = owed.add(remaining);
                }
            }
        }

        return new GroupSummaryDTO(ExpenseMemberDTO.from(caller), owes, owed, pending);
    }

    /** Gastos aprobados donde el caller es el acreedor y todavía tiene deudas sin saldar. */
    List<ExpenseDTO> owedToMe(Long groupId, String username) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);
        return expenseRepository.findByGroup_IdOrderByCreatedAtDesc(groupId).stream()
                .filter(expense -> expense.getStatus() == ExpenseStatus.APPROVED)
                .filter(expense -> expense.getDetails().getCreditor().getId().equals(caller.getId()))
                .filter(expense -> expense.getDebts().stream().anyMatch(Debt::isUnsettled))
                .map(ExpenseDTO::from)
                .toList();
    }

    /** Gastos aprobados donde el caller tiene deudas sin saldar. */
    List<ExpenseDTO> iOwe(Long groupId, String username) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);
        return expenseRepository.findByGroup_IdOrderByCreatedAtDesc(groupId).stream()
                .filter(expense -> expense.getStatus() == ExpenseStatus.APPROVED)
                .filter(expense -> expense.getDebts().stream()
                        .anyMatch(debt -> debt.getDebtor().getId().equals(caller.getId()) && debt.isUnsettled()))
                .map(ExpenseDTO::from)
                .toList();
    }

    /**
     * Balance del caller con cada miembro activo del grupo (todos, incluidos los que están en cero)
     * más el detalle de las deudas que lo componen.
     */
    List<BalanceByPersonDTO> byPerson(Long groupId, String username) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);
        Long callerId = caller.getId();

        Map<Long, PersonAccumulator> accumulators = new LinkedHashMap<>();
        groupMemberRepository.findByGroup_Id(groupId).stream()
                .filter(GroupMember::isActive)
                .filter(member -> !member.getId().equals(callerId))
                .forEach(member -> accumulators.put(member.getId(), new PersonAccumulator(member)));

        for (Expense expense : expenseRepository.findByGroup_IdOrderByCreatedAtDesc(groupId)) {
            if (expense.getStatus() != ExpenseStatus.APPROVED) {
                continue;
            }
            for (Debt debt : expense.getDebts()) {
                if (debt.getStatus() != DebtStatus.ACTIVE || !debt.isUnsettled()) {
                    continue;
                }
                BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
                Long debtorId = debt.getDebtor().getId();
                Long creditorId = debt.getCreditor().getId();

                if (debtorId.equals(callerId)) {
                    PersonAccumulator acc = accumulators.get(creditorId);
                    if (acc != null) {
                        acc.addItem(expense, debt, remaining, BalanceByPersonDTO.Type.DEBT).subtract(remaining);
                    }
                } else if (creditorId.equals(callerId)) {
                    PersonAccumulator acc = accumulators.get(debtorId);
                    if (acc != null) {
                        acc.addItem(expense, debt, remaining, BalanceByPersonDTO.Type.CREDIT).add(remaining);
                    }
                }
            }
        }

        return accumulators.values().stream().map(PersonAccumulator::toDTO).toList();
    }

    /** Acumulador mutable para armar el balance por persona; se materializa como DTO al final. */
    private static final class PersonAccumulator {
        private final GroupMember member;
        private BigDecimal netBalance = BigDecimal.ZERO;
        private final List<BalanceByPersonDTO.Item> items = new ArrayList<>();

        PersonAccumulator(GroupMember member) {
            this.member = member;
        }

        PersonAccumulator add(BigDecimal amount) {
            this.netBalance = this.netBalance.add(amount);
            return this;
        }

        PersonAccumulator subtract(BigDecimal amount) {
            this.netBalance = this.netBalance.subtract(amount);
            return this;
        }

        PersonAccumulator addItem(Expense expense, Debt debt, BigDecimal amount, BalanceByPersonDTO.Type type) {
            this.items.add(new BalanceByPersonDTO.Item(
                    expense.getId(),
                    debt.getId(),
                    expense.getDetails().getDescription(),
                    amount,
                    type
            ));
            return this;
        }

        BalanceByPersonDTO toDTO() {
            return new BalanceByPersonDTO(ExpenseMemberDTO.from(member), netBalance, List.copyOf(items));
        }
    }

    /**
     * Motivo por el que un gasto propuesto ya no puede registrarse (un involucrado dejó de estar activo o el
     * reparto se volvió imposible), o vacío si puede. Nunca lanza: lo usa una votación aprobada para decidir si
     * ejecutarse, y una excepción que cruza este límite transaccional marcaría para rollback a la votación.
     */
    public Optional<String> findRegistrationBlocker(ExpenseDetails details) {
        if (details.getCreditor().getGroup().isStopped()) {
            return Optional.of("The group is stopped: the percentages of the active members must add up to exactly 100%");
        }
        if (!details.getCreditor().isActive()) {
            return Optional.of("Member '" + details.getCreditor().getNickname() + "' is no longer an active member of this group");
        }
        for (ExpenseParticipant participant : details.getParticipants()) {
            if (!participant.getMember().isActive()) {
                return Optional.of("Member '" + participant.getMember().getNickname() + "' is no longer an active member of this group");
            }
        }
        if (!details.getParticipants().isEmpty()) {
            try {
                ExpenseSplitCalculator.split(details.getTotalAmount(), details.getSplitMethod(), details.splitParticipants());
            } catch (ResponseStatusException e) {
                return Optional.of(e.getReason() == null ? "The expense can no longer be split" : e.getReason());
            }
        }
        return Optional.empty();
    }

    /**
     * Crea un gasto ya aprobado, con sus deudas, a partir de datos propuestos y validados (una copia: no
     * comparte fila con la propuesta). No chequea el umbral extraordinario: lo usa la votación que lo aprobó.
     * Quien lo registra es el proponente; no tiene resolutor individual porque lo resolvió el grupo.
     * Antes hay que consultar {@link #findRegistrationBlocker}.
     */
    public Expense registerApprovedExpense(GroupMember proposer, ExpenseDetails proposed) {
        Expense expense = Expense.register(proposer, proposed.copy());
        expense.approve(null);
        return expenseRepository.save(expense);
    }

    private void requireBelowExtraordinaryThreshold(Group group, ExpenseDetails details) {
        if (group.getSettings().isExtraordinary(details.getTotalAmount())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The expense reaches the group's extraordinary threshold and must be submitted for a vote"
            );
        }
    }

    /**
     * El acreedor es siempre quien registra (o edita, o reenvía) el gasto: solo el creador puede
     * gestionarlo, así que {@code creator} es también quien pagó. Por eso no puede ser deudor del suyo.
     */
    private ExpenseDetails buildDetails(Long groupId, GroupMember creator, ExpenseDataDTO data) throws ItemNotFoundException {
        if (data.receiptUrl() == null || data.receiptUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A receipt is required to register an expense");
        }
        if (data.title() == null || data.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The expense needs a title");
        }
        BigDecimal total = requireValidAmount(data.totalAmount());
        requireSplitMethodAllowed(creator.getGroup(), data.splitMethod());

        Map<Long, GroupMember> membersById = groupMemberRepository.findByGroup_Id(groupId).stream()
                .collect(Collectors.toMap(GroupMember::getId, Function.identity()));

        Set<Long> seenMemberIds = new HashSet<>();
        List<ExpenseParticipant> participants = new ArrayList<>();
        for (ExpenseParticipantDTO entry : data.participants()) {
            if (!seenMemberIds.add(entry.memberId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate participant " + entry.memberId());
            }
            if (entry.memberId().equals(creator.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "The creator is the creditor of the expense and cannot be listed as a participant"
                );
            }
            participants.add(new ExpenseParticipant(requireActiveGroupMember(membersById, entry.memberId())));
        }

        String title = data.title().strip();
        String description = data.description() == null || data.description().isBlank()
                ? null
                : data.description().strip();

        ExpenseDetails details = new ExpenseDetails(
                title, description, total, data.splitMethod(), creator, data.receiptUrl().strip(), participants
        );

        // Sin participantes no hay nada que repartir: el acreedor se hace cargo de todo, sin deudas.
        if (!participants.isEmpty()) {
            // Simulacro: falla ya (y no recién al aprobar) si el reparto es imposible, p. ej. proporcional
            // entre participantes (+ acreedor) que tienen todos 0% de posesión. Se recalcula al aprobar,
            // sobre el mismo set (participantes + acreedor) que usa regenerateDebts().
            ExpenseSplitCalculator.split(total, data.splitMethod(), details.splitParticipants());
        }

        return details;
    }

    /** En un grupo EQUAL no existe el porcentaje de propiedad, así que no hay con qué repartir proporcionalmente. */
    private void requireSplitMethodAllowed(Group group, SplitMethod method) {
        DistributionMode distribution = group.getSettings().getDistributionMode();
        if (!distribution.hasOwnershipPercentages() && method.dependsOnOwnership()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Split method " + method + " is not allowed in groups with " + distribution + " distribution"
            );
        }
    }

    private BigDecimal requireValidAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0 || amount.stripTrailingZeros().scale() > 2) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "The amount must be greater than zero with at most 2 decimals"
            );
        }
        return amount.setScale(2, RoundingMode.UNNECESSARY);
    }

    private GroupMember requireActiveGroupMember(Map<Long, GroupMember> membersById, Long memberId) throws ItemNotFoundException {
        GroupMember member = membersById.get(memberId);
        if (member == null) {
            throw new ItemNotFoundException("group member", memberId);
        }
        requireActive(member);
        return member;
    }

    private void requireMembersActive(ExpenseDetails details) {
        requireActive(details.getCreditor());
        details.getParticipants().forEach(participant -> requireActive(participant.getMember()));
    }

    private void requireActive(GroupMember member) {
        if (!member.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Member '" + member.getNickname() + "' is not an active member of this group"
            );
        }
    }

    private void requireCanManage(Expense expense, GroupMember acting) {
        if (!expense.isCreatedBy(acting)) {
            throw new AccessDeniedException("Only the expense creator or an admin can perform this action");
        }
    }

    private void requireEditable(Expense expense) {
        if (expense.getStatus() == ExpenseStatus.PENDING_APPROVAL) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The expense is pending approval and cannot be edited until it is resolved"
            );
        }
        if (expense.getStatus() == ExpenseStatus.REJECTED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "A rejected expense must be resubmitted instead of edited"
            );
        }
    }

    private Debt requireDebtInExpense(Expense expense, Long debtId) throws ItemNotFoundException {
        return expense.getDebts().stream()
                .filter(debt -> debt.getId().equals(debtId))
                .findFirst()
                .orElseThrow(() -> new ItemNotFoundException("debt", debtId));
    }

    private void requireDebtor(Debt debt, GroupMember caller) {
        if (!debt.getDebtor().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Only the debtor can declare their own debt as paid");
        }
    }

    private void requireApproved(Expense expense) {
        if (expense.getStatus() != ExpenseStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The expense is not approved, it is " + expense.getStatus()
            );
        }
    }

    private void requireDebtActive(Debt debt) {
        if (debt.getStatus() != DebtStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The debt is suspended and cannot receive payments right now"
            );
        }
    }

    private BigDecimal requireValidPaymentAmount(Debt debt, BigDecimal amount) {
        BigDecimal normalized = requireValidAmount(amount);
        BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
        if (normalized.compareTo(remaining) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The payment amount exceeds the remaining debt of " + remaining
            );
        }
        return normalized;
    }

    private String requireReceiptUrl(String receiptUrl) {
        if (receiptUrl == null || receiptUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A receipt is required to declare a payment");
        }
        return receiptUrl.strip();
    }

    private void requireNoPayments(Expense expense) {
        if (expense.hasPayments()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The expense has payments and can no longer be edited or deleted"
            );
        }
    }

    private void requirePendingApproval(Expense expense) {
        if (expense.getStatus() == ExpenseStatus.PENDING_APPROVAL) {
            return;
        }
        if (expense.getLastResolvedBy() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The expense is not pending approval, it is " + expense.getStatus()
            );
        }
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "The expense was already resolved by " + expense.getLastResolvedBy().getNickname()
                        + ": " + expense.getLastOutcome()
        );
    }

    private Expense requireExpense(Long groupId, Long expenseId) throws ItemNotFoundException {
        return requireInGroup(expenseRepository.findById(expenseId), groupId, expenseId);
    }

    private Expense requireExpenseForUpdate(Long groupId, Long expenseId) throws ItemNotFoundException {
        return requireInGroup(expenseRepository.findWithLockById(expenseId), groupId, expenseId);
    }

    private Expense requireInGroup(Optional<Expense> found, Long groupId, Long expenseId) throws ItemNotFoundException {
        Expense expense = found.orElseThrow(() -> new ItemNotFoundException("expense", expenseId));
        if (!expense.getGroup().getId().equals(groupId)) {
            throw new ItemNotFoundException("expense", expenseId);
        }
        return expense;
    }
}
