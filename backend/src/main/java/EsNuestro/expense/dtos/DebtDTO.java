package EsNuestro.expense.dtos;

import EsNuestro.expense.Debt;
import EsNuestro.expense.DebtKind;
import EsNuestro.expense.DebtStatus;

import java.math.BigDecimal;

/**
 * {@code kind} distingue la parte de un participante (SHARE) de una devolución (REFUND), en la que el deudor es el
 * acreedor del gasto y el acreedor es quien pagó de más.
 */
public record DebtDTO(
        Long id,
        ExpenseMemberDTO debtor,
        ExpenseMemberDTO creditor,
        BigDecimal amount,
        BigDecimal paidAmount,
        DebtStatus status,
        DebtKind kind
) {
    public static DebtDTO from(Debt debt) {
        return new DebtDTO(
                debt.getId(),
                ExpenseMemberDTO.from(debt.getDebtor()),
                ExpenseMemberDTO.from(debt.getCreditor()),
                debt.getAmount(),
                debt.getPaidAmount(),
                debt.getStatus(),
                debt.getKind()
        );
    }
}
