package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ExpenseCostForTest {

    private GroupMember creditor;
    private GroupMember debtorA;
    private GroupMember debtorB;
    private Expense expense;

    private static GroupMember member(long id) {
        GroupMember member = mock(GroupMember.class);
        when(member.getId()).thenReturn(id);
        return member;
    }

    private static void assertAmount(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), "esperaba " + expected + " y fue " + actual);
    }

    @BeforeEach
    void setUp() {
        creditor = member(1L);
        debtorA = member(2L);
        debtorB = member(3L);
        ExpenseDetails details = new ExpenseDetails(
                "Techo", null, ExpenseCategory.MANTENIMIENTO, new BigDecimal("100.00"), SplitMethod.EQUAL,
                creditor, "https://receipt", List.of()
        );
        expense = Expense.register(creditor, details);
    }

    @Test
    void aDebtorPaysOnlyItsShare() {
        expense.getDebts().add(Debt.of(expense, debtorA, new BigDecimal("30.00")));
        expense.getDebts().add(Debt.of(expense, debtorB, new BigDecimal("20.00")));

        assertAmount("30.00", expense.costFor(2L));
        assertAmount("20.00", expense.costFor(3L));
    }

    @Test
    void theCreditorBearsWhatTheOthersDoNotOwe() {
        expense.getDebts().add(Debt.of(expense, debtorA, new BigDecimal("30.00")));
        expense.getDebts().add(Debt.of(expense, debtorB, new BigDecimal("20.00")));

        assertAmount("50.00", expense.costFor(1L));
    }

    @Test
    void allMembersAddUpToTheTotal() {
        expense.getDebts().add(Debt.of(expense, debtorA, new BigDecimal("30.00")));
        expense.getDebts().add(Debt.of(expense, debtorB, new BigDecimal("20.00")));

        BigDecimal sum = expense.costFor(1L).add(expense.costFor(2L)).add(expense.costFor(3L));
        assertAmount("100.00", sum);
    }

    @Test
    void withoutDebtsTheCreditorCoversEverything() {
        assertAmount("100.00", expense.costFor(1L));
    }

    @Test
    void refundsAreNotSpending() {
        expense.getDebts().add(Debt.of(expense, debtorA, new BigDecimal("30.00")));
        expense.getDebts().add(Debt.refund(expense, creditor, debtorA, new BigDecimal("10.00")));

        assertAmount("30.00", expense.costFor(2L));
        assertAmount("70.00", expense.costFor(1L));
    }

    @Test
    void someoneUninvolvedPaysNothing() {
        expense.getDebts().add(Debt.of(expense, debtorA, new BigDecimal("30.00")));

        assertAmount("0", expense.costFor(99L));
    }
}
