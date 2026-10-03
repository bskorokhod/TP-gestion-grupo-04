package EsNuestro.vote;

import EsNuestro.expense.ExpenseDetails;
import EsNuestro.expense.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** Al aprobarse, crea el gasto propuesto (aprobado y con sus deudas) a nombre de quien lo propuso. */
@Component
class ExtraordinaryExpenseVoteExecutor implements VoteExecutor {

    private final ExpenseService expenseService;

    @Autowired
    ExtraordinaryExpenseVoteExecutor(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @Override
    public VoteType type() {
        return VoteType.EXTRAORDINARY_EXPENSE;
    }

    @Override
    public Optional<String> execute(Vote vote) {
        if (!(vote instanceof ExtraordinaryExpenseVote expenseVote)) {
            throw new IllegalStateException("Vote " + vote.getId() + " is not an extraordinary expense vote");
        }
        ExpenseDetails proposed = expenseVote.getProposedDetails();

        Optional<String> blocker = expenseService.findRegistrationBlocker(proposed);
        if (blocker.isPresent()) {
            return blocker;
        }
        expenseService.registerApprovedExpense(expenseVote.getProposer(), proposed);
        return Optional.empty();
    }
}
