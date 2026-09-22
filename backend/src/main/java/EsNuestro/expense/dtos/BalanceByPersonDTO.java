package EsNuestro.expense.dtos;

import java.math.BigDecimal;
import java.util.List;

public record BalanceByPersonDTO(
        ExpenseMemberDTO member,
        BigDecimal netBalance,
        List<Item> items
) {
    public record Item(
            Long expenseId,
            Long debtId,
            String description,
            BigDecimal amount,
            Type type
    ) {
    }

    public enum Type {
        CREDIT,
        DEBT
    }
}