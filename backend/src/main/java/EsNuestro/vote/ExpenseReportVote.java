package EsNuestro.vote;

import EsNuestro.expense.Expense;
import EsNuestro.expense.ExpenseDetails;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Se vota si modificar o eliminar un gasto ya registrado.
 * <p>
 * TODO: esqueleto sin terminar. Falta el constructor, el endpoint de creación, el {@code VoteExecutor}
 * (editar/eliminar el gasto al aprobarse) y definir quiénes son los involucrados. Los campos son una
 * primera propuesta, sin validar. Cuando se implemente, cerrar también el agujero descripto en los TODO
 * de {@code ExpenseService.updateExpense} y {@code ExpenseService.resubmitExpense}.
 */
@Entity
@Table(name = "expense_report_votes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class ExpenseReportVote extends Vote {

    public enum Action {
        EDIT,
        DELETE
    }

    @ManyToOne(optional = false)
    @JoinColumn(name = "target_expense_id", nullable = false)
    private Expense targetExpense;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Action action;

    /** Datos propuestos para el gasto; solo con {@link Action#EDIT}. */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "proposed_details_id")
    private ExpenseDetails proposedDetails;
}
