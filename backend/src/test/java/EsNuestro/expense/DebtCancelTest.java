package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class DebtCancelTest {

    private Debt debt() {
        return Debt.of(mock(Expense.class), mock(GroupMember.class), new BigDecimal("500.00"));
    }

    @Test
    void cancelingKeepsAmountAndPaymentsAndReportsWhatRemains() {
        Debt debt = debt();
        debt.registerPayment(new BigDecimal("200.00"), "https://receipt");

        debt.cancel();

        assertEquals(DebtStatus.CANCELED, debt.getStatus());
        assertEquals(new BigDecimal("300.00"), debt.remaining());
        assertTrue(debt.hasPayments());
    }

    @Test
    void aCanceledDebtIsNotRestoredNorSuspendedNorReactivatedByAReconciliation() {
        Debt debt = debt();
        debt.cancel();

        debt.suspend();
        assertEquals(DebtStatus.CANCELED, debt.getStatus());
        debt.reactivate();
        assertEquals(DebtStatus.CANCELED, debt.getStatus());
        debt.reconcileTo(new BigDecimal("400.00"), BigDecimal.ZERO);
        assertEquals(DebtStatus.CANCELED, debt.getStatus());
    }
}
