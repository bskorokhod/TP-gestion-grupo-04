package EsNuestro.vote;

import EsNuestro.expense.Expense;
import EsNuestro.expense.ExpenseDetails;
import EsNuestro.expense.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Al aprobarse un reporte, modifica o elimina (lógicamente) el gasto, conciliando las deudas con lo ya pagado: quien
 * pagó de más queda con una devolución a favor. Antes revalida que el gasto siga vigente y que la modificación todavía
 * pueda registrarse (un participante pudo irse del grupo mientras se votaba); si no, devuelve el motivo y la votación
 * queda con resultado EXECUTION_FAILED y el gasto intacto.
 * <p>
 * En todos los casos (aprobado, fallido o rechazado) desbloquea el gasto, que quedó bloqueado desde que se abrió la
 * votación.
 */
@Component
class ExpenseReportVoteExecutor implements VoteExecutor {

    private final ExpenseService expenseService;

    @Autowired
    ExpenseReportVoteExecutor(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @Override
    public VoteType type() {
        return VoteType.EXPENSE_REPORT;
    }

    @Override
    public Optional<String> execute(Vote vote) {
        ExpenseReportVote report = reportOf(vote);
        Expense target = report.getTargetExpense();
        ExpenseDetails proposed = report.getProposedDetails();

        Optional<String> blocker = expenseService.findReportBlocker(target, proposed);
        target.unlockReport();
        if (blocker.isPresent()) {
            return blocker;
        }

        if (report.getAction() == ExpenseReportVote.Action.EDIT) {
            // Una copia: el gasto no comparte fila con la propuesta, que se conserva en la votación para el historial.
            target.applyEdit(proposed.copy());
        } else {
            target.cancel();
        }
        return Optional.empty();
    }

    @Override
    public void onRejected(Vote vote) {
        reportOf(vote).getTargetExpense().unlockReport();
    }

    private ExpenseReportVote reportOf(Vote vote) {
        if (!(vote instanceof ExpenseReportVote report)) {
            throw new IllegalStateException("Vote " + vote.getId() + " is not an expense report vote");
        }
        return report;
    }
}
