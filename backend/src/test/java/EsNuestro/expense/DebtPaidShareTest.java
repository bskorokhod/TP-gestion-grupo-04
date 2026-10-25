package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.springframework.test.util.ReflectionTestUtils;

class DebtPaidShareTest {

    private GroupMember creditor;
    private GroupMember debtor;
    private Expense expense;

    private static GroupMember member(long id) {
        GroupMember member = mock(GroupMember.class);
        when(member.getId()).thenReturn(id);
        return member;
    }

    @BeforeEach
    void setUp() {
        creditor = member(1L);
        debtor = member(2L);
        expense = mock(Expense.class);
    }

    @Test
    void aSharePaidInFullIsPaid() {
        Debt debt = Debt.of(expense, debtor, new BigDecimal("30.00"));
        debt.registerPayment(new BigDecimal("30.00"), "https://receipt");

        assertTrue(debt.isPaidShare());
    }

    @Test
    void aSharePaidInSeveralPaymentsIsPaidOnceCompleted() {
        Debt debt = Debt.of(expense, debtor, new BigDecimal("30.00"));
        debt.registerPayment(new BigDecimal("10.00"), "https://receipt-1");
        assertFalse(debt.isPaidShare());

        debt.registerPayment(new BigDecimal("20.00"), "https://receipt-2");
        assertTrue(debt.isPaidShare());
    }

    @Test
    void aPartiallyPaidShareIsNotPaid() {
        Debt debt = Debt.of(expense, debtor, new BigDecimal("30.00"));
        debt.registerPayment(new BigDecimal("29.99"), "https://receipt");

        assertFalse(debt.isPaidShare());
    }

    @Test
    void anUnpaidShareIsNotPaid() {
        Debt debt = Debt.of(expense, debtor, new BigDecimal("30.00"));

        assertFalse(debt.isPaidShare());
    }

    @Test
    void aShareWithNothingToPayIsNotPaid() {
        Debt debt = Debt.of(expense, debtor, BigDecimal.ZERO);

        assertFalse(debt.isPaidShare());
    }

    @Test
    void aRefundPaidInFullIsNotAPaidShare() {
        Debt refund = Debt.refund(expense, creditor, debtor, new BigDecimal("10.00"));
        refund.registerPayment(new BigDecimal("10.00"), "https://receipt");

        assertFalse(refund.isPaidShare());
    }

    @Test
    void lastPaymentAtIsTheDateOfTheMostRecentPayment() {
        Instant earlier = Instant.parse("2026-03-01T10:00:00Z");
        Instant later = Instant.parse("2026-04-15T18:30:00Z");
        Debt debt = Debt.of(expense, debtor, new BigDecimal("30.00"));
        debt.registerPayment(new BigDecimal("10.00"), "https://receipt-1");
        debt.registerPayment(new BigDecimal("20.00"), "https://receipt-2");
        // El más reciente no es el último de la lista: se toma por fecha y no por orden de carga.
        ReflectionTestUtils.setField(debt.getPayments().get(0), "paidAt", later);
        ReflectionTestUtils.setField(debt.getPayments().get(1), "paidAt", earlier);

        assertEquals(later, debt.lastPaymentAt());
    }

    @Test
    void lastPaymentAtIsNullWithoutPayments() {
        Debt debt = Debt.of(expense, debtor, new BigDecimal("30.00"));

        assertNull(debt.lastPaymentAt());
    }
}
