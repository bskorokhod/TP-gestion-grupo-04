package EsNuestro.expense.dtos;

import EsNuestro.expense.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * {@code details} son los datos vigentes; {@code pendingDetails} es la edición en revisión de un
 * gasto aprobado (null si no hay). {@code lastResolution} es la última aprobación o rechazo.
 */
public record ExpenseDTO(
        Long id,
        Long groupId,
        ExpenseMemberDTO creator,
        ExpenseStatus status,
        Details details,
        Details pendingDetails,
        Resolution lastResolution,
        List<DebtDTO> debts,
        Instant createdAt
) {

    public record Details(
            String description,
            BigDecimal totalAmount,
            SplitMethod splitMethod,
            ExpenseMemberDTO creditor,
            String receiptUrl,
            List<Participant> participants
    ) {
        static Details from(ExpenseDetails details) {
            if (details == null) {
                return null;
            }
            return new Details(
                    details.getDescription(),
                    details.getTotalAmount(),
                    details.getSplitMethod(),
                    ExpenseMemberDTO.from(details.getCreditor()),
                    details.getReceiptUrl(),
                    details.getParticipants().stream().map(Participant::from).toList()
            );
        }
    }

    public record Participant(ExpenseMemberDTO member, BigDecimal customPercentage) {
        static Participant from(ExpenseParticipant participant) {
            return new Participant(ExpenseMemberDTO.from(participant.getMember()), participant.getCustomPercentage());
        }
    }

    public record Resolution(ExpenseMemberDTO resolvedBy, ReviewOutcome outcome, Instant resolvedAt) {
        static Resolution from(Expense expense) {
            if (expense.getLastResolvedBy() == null) {
                return null;
            }
            return new Resolution(
                    ExpenseMemberDTO.from(expense.getLastResolvedBy()),
                    expense.getLastOutcome(),
                    expense.getLastResolvedAt()
            );
        }
    }

    public static ExpenseDTO from(Expense expense) {
        return new ExpenseDTO(
                expense.getId(),
                expense.getGroup().getId(),
                ExpenseMemberDTO.from(expense.getCreator()),
                expense.getStatus(),
                Details.from(expense.getDetails()),
                Details.from(expense.getPendingDetails()),
                Resolution.from(expense),
                expense.getDebts().stream().map(DebtDTO::from).toList(),
                expense.getCreatedAt()
        );
    }
}
