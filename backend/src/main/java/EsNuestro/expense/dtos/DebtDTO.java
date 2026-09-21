package EsNuestro.expense.dtos;

import EsNuestro.expense.Debt;
import EsNuestro.expense.DebtStatus;

import java.math.BigDecimal;

public record DebtDTO(
        Long id,
        ExpenseMemberDTO debtor,
        ExpenseMemberDTO creditor,
        BigDecimal amount,
        BigDecimal paidAmount,
        DebtStatus status
) {
    public static DebtDTO from(Debt debt) {
        return new DebtDTO(
                debt.getId(),
                ExpenseMemberDTO.from(debt.getDebtor()),
                ExpenseMemberDTO.from(debt.getCreditor()),
                debt.getAmount(),
                debt.getPaidAmount(),
                debt.getStatus()
        );
    }
}
