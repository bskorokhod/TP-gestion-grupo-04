package EsNuestro.expense;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.expense.dtos.ExpenseDTO;
import EsNuestro.expense.dtos.ExpenseDataDTO;
import EsNuestro.expense.dtos.ExpenseParticipantDTO;
import EsNuestro.group.GroupService;
import EsNuestro.member.GroupMember;
import EsNuestro.member.GroupMemberRepository;
import EsNuestro.member.GroupRole;
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
class ExpenseService {

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

    /** Un admin lo crea aprobado (con deudas); un miembro regular lo crea pendiente, sin deudas. */
    ExpenseDTO createExpense(Long groupId, ExpenseDataDTO data, String username) throws ItemNotFoundException {
        groupService.requireGroupForUpdate(groupId);
        GroupMember creator = groupService.requireActiveMember(groupId, username);

        Expense expense = Expense.register(creator, buildDetails(groupId, data));
        if (creator.isAdmin()) {
            expense.approve(creator);
        }
        return ExpenseDTO.from(expenseRepository.save(expense));
    }

    /** Admin: ve todos. Resto: solo los gastos en los que está involucrado. */
    List<ExpenseDTO> listExpenses(Long groupId, String username, ExpenseStatus status) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);

        return expenseRepository.findByGroup_IdOrderByCreatedAtDesc(groupId).stream()
                .filter(expense -> status == null || expense.getStatus() == status)
                .filter(expense -> canView(expense, caller))
                .map(ExpenseDTO::from)
                .toList();
    }

    ExpenseDTO getExpense(Long groupId, Long expenseId, String username) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);
        Expense expense = requireExpense(groupId, expenseId);
        if (!canView(expense, caller)) {
            throw new AccessDeniedException("You don't have access to this expense");
        }
        return ExpenseDTO.from(expense);
    }

    /**
     * Edita un gasto aprobado y sin pagos. Si edita un admin se aplica directo; si edita el creador
     * (no admin) queda pendiente de aprobación y sus deudas se suspenden hasta la resolución.
     */
    ExpenseDTO updateExpense(Long groupId, Long expenseId, ExpenseDataDTO data, String username) throws ItemNotFoundException {
        groupService.requireGroupForUpdate(groupId);
        GroupMember acting = groupService.requireActiveMember(groupId, username);
        Expense expense = requireExpenseForUpdate(groupId, expenseId);

        requireCanManage(expense, acting);
        requireEditable(expense);
        requireNoPayments(expense);

        expense.proposeEdit(buildDetails(groupId, data));
        if (acting.isAdmin()) {
            expense.approve(acting);
        }
        return ExpenseDTO.from(expense);
    }

    ExpenseDTO approveExpense(Long groupId, Long expenseId, String username) throws ItemNotFoundException {
        groupService.requireGroupForUpdate(groupId);
        GroupMember acting = groupService.requireActiveMember(groupId, username);
        groupService.requireAtLeast(acting, GroupRole.ADMIN);
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
        groupService.requireAtLeast(acting, GroupRole.ADMIN);
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
        groupService.requireGroupForUpdate(groupId);
        GroupMember acting = groupService.requireActiveMember(groupId, username);
        Expense expense = requireExpenseForUpdate(groupId, expenseId);

        requireCanManage(expense, acting);
        if (expense.getStatus() != ExpenseStatus.REJECTED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only rejected expenses can be resubmitted, but it was " + expense.getStatus()
            );
        }

        ExpenseDetails newDetails = changes == null ? null : buildDetails(groupId, changes);
        if (newDetails == null) {
            requireMembersActive(expense.getDetails());
        }

        expense.resubmit(newDetails);
        if (acting.isAdmin()) {
            expense.approve(acting);
        }
        return ExpenseDTO.from(expense);
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

    private ExpenseDetails buildDetails(Long groupId, ExpenseDataDTO data) throws ItemNotFoundException {
        if (data.receiptUrl() == null || data.receiptUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A receipt is required to register an expense");
        }
        if (data.title() == null || data.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The expense needs a title");
        }
        BigDecimal total = requireValidAmount(data.totalAmount());

        Map<Long, GroupMember> membersById = groupMemberRepository.findByGroup_Id(groupId).stream()
                .collect(Collectors.toMap(GroupMember::getId, Function.identity()));
        GroupMember creditor = requireActiveGroupMember(membersById, data.creditorId());

        boolean custom = data.splitMethod() == SplitMethod.CUSTOM;
        Set<Long> seenMemberIds = new HashSet<>();
        List<ExpenseParticipant> participants = new ArrayList<>();
        for (ExpenseParticipantDTO entry : data.participants()) {
            if (!seenMemberIds.add(entry.memberId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate participant " + entry.memberId());
            }
            if (!custom && entry.percentage() != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Percentages are only allowed when the split method is CUSTOM"
                );
            }
            GroupMember member = requireActiveGroupMember(membersById, entry.memberId());
            participants.add(new ExpenseParticipant(member, custom ? entry.percentage() : null));
        }

        // Sin participantes no hay nada que repartir: el acreedor se hace cargo de todo, sin deudas.
        if (!participants.isEmpty()) {
            if (custom) {
                ExpenseSplitCalculator.requireValidCustomPercentages(participants);
            }
            // Simulacro: falla ya (y no recién al aprobar) si el reparto es imposible, p. ej. proporcional
            // entre participantes que tienen todos 0% de posesión. Se recalcula al aprobar.
            ExpenseSplitCalculator.split(total, data.splitMethod(), participants);
        }

        String title = data.title().strip();
        String description = data.description() == null || data.description().isBlank()
                ? null
                : data.description().strip();

        return new ExpenseDetails(
                title, description, total, data.splitMethod(), creditor, data.receiptUrl().strip(), participants
        );
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

    private boolean canView(Expense expense, GroupMember caller) {
        return caller.isAdmin() || expense.isInvolved(caller);
    }

    private void requireCanManage(Expense expense, GroupMember acting) {
        if (!acting.isAdmin() && !expense.isCreatedBy(acting)) {
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
