package EsNuestro.vote.dtos;

import EsNuestro.expense.dtos.ExpenseDTO;
import EsNuestro.vote.ExpenseReportVote;

/**
 * Lo que se vota en un reporte de gasto. {@code previous} son los datos del gasto al proponer y {@code proposed} los
 * datos propuestos (null en una eliminación, donde solo se muestran los valores actuales).
 */
public record ExpenseReportDTO(
        Long expenseId,
        ExpenseReportVote.Action action,
        ExpenseDTO.Details previous,
        ExpenseDTO.Details proposed
) {

    public static ExpenseReportDTO from(ExpenseReportVote vote) {
        return new ExpenseReportDTO(
                vote.getTargetExpense().getId(),
                vote.getAction(),
                ExpenseDTO.Details.from(vote.getPreviousDetails()),
                ExpenseDTO.Details.from(vote.getProposedDetails())
        );
    }
}
