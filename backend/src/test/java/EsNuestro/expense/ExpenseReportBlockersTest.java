package EsNuestro.expense;

import EsNuestro.group.Group;
import EsNuestro.group.GroupService;
import EsNuestro.member.GroupMember;
import EsNuestro.member.GroupMemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Eliminar o modificar (por votación) un gasto cuyo acreedor ya salió del grupo está permitido. */
class ExpenseReportBlockersTest {

    private ExpenseService service;
    private Expense expense;
    private GroupMember creditor;

    @BeforeEach
    void setUp() {
        service = new ExpenseService(mock(ExpenseRepository.class), mock(DebtRepository.class),
                mock(GroupMemberRepository.class), mock(GroupService.class));
        Group group = mock(Group.class);
        when(group.isStopped()).thenReturn(false);
        creditor = mock(GroupMember.class);
        when(creditor.getGroup()).thenReturn(group);
        when(creditor.isActive()).thenReturn(false);
        ExpenseDetails details = mock(ExpenseDetails.class);
        when(details.getCreditor()).thenReturn(creditor);
        when(details.getParticipants()).thenReturn(List.of());
        expense = mock(Expense.class);
        when(expense.getStatus()).thenReturn(ExpenseStatus.APPROVED);
        when(expense.getDetails()).thenReturn(details);
    }

    @Test
    void deletingIsNotBlockedWhenTheCreditorLeft() {
        when(expense.hasPayments()).thenReturn(true);

        assertThat(service.findReportBlocker(expense, null)).isEmpty();
    }

    @Test
    void editingIsNotBlockedWhenTheCreditorLeft() {
        ExpenseDetails proposed = expense.getDetails();

        assertThat(service.findReportBlocker(expense, proposed)).isEmpty();
    }

    @Test
    void registeringANewExpenseStillRequiresAnActiveCreditor() {
        assertThat(service.findRegistrationBlocker(expense.getDetails()))
                .hasValueSatisfying(reason -> assertThat(reason).doesNotContain("'"));
    }
}
