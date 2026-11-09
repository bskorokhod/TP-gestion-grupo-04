package EsNuestro.expense;

import EsNuestro.group.DistributionMode;
import EsNuestro.group.Group;
import EsNuestro.group.GroupSettings;
import EsNuestro.group.ReservationLimitPolicy;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import EsNuestro.member.MemberColor;
import EsNuestro.expense.dtos.ExpenseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Gastos con miembros que salieron: deudas que nacen canceladas y "requiere modificación" derivado. */
class ExpenseInactiveMembersTest {

    private GroupMember creditor;
    private GroupMember debtor;
    private GroupMember other;

    private GroupMember member(Group group, long id, String nickname) {
        GroupMember member = GroupMember.founder(group, new EsNuestro.user.User("pw", "USER", nickname, "X", nickname + "@mail.com", null, null), nickname, MemberColor.BLUE, new BigDecimal("33.33"));
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    @BeforeEach
    void setUp() {
        Group group = new Group("Casa", "Casa", "ABC-1234-XYZ", new GroupSettings(
                DistributionMode.EQUAL, VotingModel.SIMPLE_MAJORITY, ReservationLimitPolicy.EQUAL, null, new BigDecimal("100000"), 10));
        creditor = member(group, 1, "B");
        debtor = member(group, 2, "A");
        other = member(group, 3, "C");
    }

    private ExpenseDetails details(String total, GroupMember... participants) {
        return new ExpenseDetails("Alquiler", null, ExpenseCategory.SIN_CATEGORIA, new BigDecimal(total),
                SplitMethod.EQUAL, creditor, "https://receipt", 10,
                java.util.Arrays.stream(participants).map(ExpenseParticipant::new).toList());
    }

    /** Aprobado, con A habiendo pagado 200 de lo suyo. */
    private Expense approvedWithPayment() {
        Expense expense = Expense.register(creditor, details("500.00", debtor));
        ReflectionTestUtils.setField(expense, "group", debtor.getGroup());
        expense.approve(creditor);
        expense.getDebts().get(0).registerPayment(new BigDecimal("200.00"), "https://r");
        return expense;
    }

    @Test
    void deletingAnExpenseWhoseCreditorLeftCreatesTheRefundAlreadyCanceled() {
        Expense expense = approvedWithPayment();
        creditor.leave();

        expense.cancel();

        Debt refund = expense.getDebts().stream().filter(Debt::isRefund).findFirst().orElseThrow();
        assertThat(refund.getStatus()).isEqualTo(DebtStatus.CANCELED);
        assertThat(refund.getAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    void deletingWhileTheCreditorIsActiveCreatesAnActiveRefund() {
        Expense expense = approvedWithPayment();

        expense.cancel();

        Debt refund = expense.getDebts().stream().filter(Debt::isRefund).findFirst().orElseThrow();
        assertThat(refund.getStatus()).isEqualTo(DebtStatus.ACTIVE);
    }

    @Test
    void editingAnExpenseWhoseCreditorLeftCreatesNoActiveDebtTowardsHim() {
        Expense expense = approvedWithPayment();
        creditor.leave();

        expense.applyEdit(details("5000.00", debtor, other));

        assertThat(expense.getDebts()).isNotEmpty();
        assertThat(expense.getDebts()).allMatch(debt -> debt.getStatus() == DebtStatus.CANCELED || !debt.isUnsettled());
    }

    @Test
    void anApprovedExpenseWithAnInactiveParticipantWhoPaidAndAnotherPendingDebtorDoesNotRequireModification() {
        Expense expense = Expense.register(creditor, details("600.00", debtor, other));
        ReflectionTestUtils.setField(expense, "group", debtor.getGroup());
        expense.approve(creditor);
        expense.getDebts().stream().filter(d -> d.getDebtor() == debtor).findFirst().orElseThrow()
                .registerPayment(new BigDecimal("150.00"), "https://r");
        debtor.leave();

        assertThat(expense.inactiveInvolvedMembers()).containsExactly(debtor);
        assertThat(expense.requiresModification()).isFalse();
        ExpenseDTO dto = ExpenseDTO.from(expense);
        assertThat(dto.requiresModification()).isFalse();
        assertThat(dto.inactiveMembers()).isEmpty();
    }

    @Test
    void comingBackWithTheSameRowKeepsTheOldCanceledDebtsCanceled() {
        Expense expense = approvedWithPayment();
        Debt debt = expense.getDebts().get(0);
        debt.cancel();
        creditor.leave();

        creditor.requestAgain("B", MemberColor.RED, null);
        creditor.approve();

        assertThat(creditor.isActive()).isTrue();
        assertThat(debt.getStatus()).isEqualTo(DebtStatus.CANCELED);
        assertThat(debt.getCreditor()).isSameAs(creditor);
        assertThat(ExpenseDTO.from(expense).debts().get(0).creditor().nickname()).isEqualTo("B");
    }

    private java.util.List<EsNuestro.expense.dtos.PaidExpenseDTO> history(Debt... debtsOfCaller) throws Exception {
        DebtRepository debts = org.mockito.Mockito.mock(DebtRepository.class);
        EsNuestro.group.GroupService groups = org.mockito.Mockito.mock(EsNuestro.group.GroupService.class);
        org.mockito.Mockito.when(groups.requireViewer(1L, "a@x")).thenReturn(debtor);
        org.mockito.Mockito.when(debts.findByDebtorInGroupAndExpenseStatus(1L, debtor.getId(), ExpenseStatus.APPROVED))
                .thenReturn(List.of(debtsOfCaller));
        ExpenseService service = new ExpenseService(org.mockito.Mockito.mock(ExpenseRepository.class), debts,
                org.mockito.Mockito.mock(EsNuestro.member.GroupMemberRepository.class), groups);
        return service.listPaidByMe(1L, "a@x");
    }

    private Debt paidDebt() {
        Expense expense = Expense.register(creditor, details("100.00", debtor));
        ReflectionTestUtils.setField(expense, "group", debtor.getGroup());
        expense.approve(creditor);
        Debt debt = expense.getDebts().get(0);
        debt.registerPayment(debt.getAmount(), "https://r");
        return debt;
    }

    @Test
    void theHistoryListsPaidSharesFirstAndCanceledOnesLastWithoutDate() throws Exception {
        Debt paid = paidDebt();
        Debt canceled = approvedWithPayment().getDebts().get(0);
        canceled.cancel();

        var rows = history(canceled, paid);

        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).canceled()).isFalse();
        assertThat(rows.get(0).paidAt()).isNotNull();
        assertThat(rows.get(0).canceledAmount()).isNull();
        var last = rows.get(1);
        assertThat(last.canceled()).isTrue();
        assertThat(last.paidAt()).isNull();
        assertThat(last.creditor().nickname()).isEqualTo("B");
        assertThat(last.paidAmount()).isEqualByComparingTo("200.00");
        assertThat(last.canceledAmount()).isEqualByComparingTo("50.00");
    }

    @Test
    void anApprovedExpenseWithAnInactiveCreditorDoesNotRequireModification() {
        Expense expense = approvedWithPayment();
        creditor.leave();

        assertThat(expense.requiresModification()).isFalse();
        assertThat(ExpenseDTO.from(expense).inactiveMembers()).isEmpty();
    }

    @Test
    void anExpenseWithOnlyActiveMembersDoesNotRequireModification() {
        Expense expense = approvedWithPayment();

        assertThat(expense.requiresModification()).isFalse();
        assertThat(ExpenseDTO.from(expense).inactiveMembers()).isEmpty();
    }

    @Test
    void aFullySettledApprovedExpenseDoesNotRequireModification() {
        Expense expense = approvedWithPayment();
        expense.getDebts().get(0).registerPayment(new BigDecimal("300.00"), "https://r");
        debtor.leave();

        assertThat(expense.requiresModification()).isFalse();
        assertThat(ExpenseDTO.from(expense).inactiveMembers()).isEmpty();
    }

    @Test
    void anApprovedExpenseWhoseOnlyPendingDebtWasCanceledDoesNotRequireModification() {
        Expense expense = approvedWithPayment();
        expense.getDebts().get(0).cancel();
        creditor.leave();

        assertThat(expense.requiresModification()).isFalse();
    }

    @Test
    void aDeletedExpenseDoesNotRequireModification() {
        Expense expense = approvedWithPayment();
        expense.cancel();
        debtor.leave();

        assertThat(expense.requiresModification()).isFalse();
        assertThat(ExpenseDTO.from(expense).inactiveMembers()).isEqualTo(List.of());
    }

    @Test
    void aPendingApprovalExpenseWithAnInactiveParticipantRequiresModification() {
        Expense expense = Expense.register(creditor, details("500.00", debtor));
        debtor.leave();

        assertThat(expense.requiresModification()).isTrue();
        ExpenseDTO dto = ExpenseDTO.from(expense);
        assertThat(dto.requiresModification()).isTrue();
        assertThat(dto.inactiveMembers()).extracting(ExpenseDTO.InactiveMember::nickname).containsExactly("A");
    }

    @Test
    void anEditUnderReviewWithAnInactiveMemberRequiresModification() {
        Expense expense = approvedWithPayment();
        expense.proposeEdit(details("900.00", debtor, other));
        other.leave();

        assertThat(expense.requiresModification()).isTrue();
        assertThat(expense.inactiveInvolvedMembers()).containsExactly(other);
    }

    @Test
    void anEditUnderReviewWithOnlyActiveMembersDoesNotRequireModification() {
        Expense expense = approvedWithPayment();
        expense.proposeEdit(details("900.00", debtor, other));

        assertThat(expense.requiresModification()).isFalse();
    }
}
