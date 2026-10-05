package EsNuestro.vote;

import EsNuestro.expense.Expense;
import EsNuestro.expense.ExpenseDetails;
import EsNuestro.group.Group;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
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
 * Se vota si modificar o eliminar un gasto ya registrado (un "reporte"). Votan, con el modelo de votación del grupo, la
 * unión de los miembros involucrados en el gasto: el acreedor, los participantes actuales y, si es una modificación,
 * los participantes propuestos. El voto "sí" de quien propone es automático.
 * <p>
 * Mientras la votación está activa el gasto queda bloqueado ({@code Expense.reportInProgress}): no se puede pagar
 * ninguna de sus deudas, ni modificarlo, eliminarlo o reportarlo de nuevo. Lo desbloquea el
 * {@code ExpenseReportVoteExecutor} al aprobarse, fallar o rechazarse la votación.
 * <p>
 * {@code previousDetails} es una copia de los datos del gasto al proponer: al aprobarse una modificación el gasto
 * pierde los datos viejos, y esta copia conserva qué cambió para el historial. {@code proposedDetails} solo existe en
 * una modificación; una eliminación no lo tiene.
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

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "previous_details_id")
    private ExpenseDetails previousDetails;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "proposed_details_id")
    private ExpenseDetails proposedDetails;

    private ExpenseReportVote(
            Group group, GroupMember proposer, VotingModel votingModel,
            Expense targetExpense, Action action, ExpenseDetails proposedDetails
    ) {
        super(group, proposer, VoteType.EXPENSE_REPORT, votingModel);
        this.targetExpense = targetExpense;
        this.action = action;
        this.previousDetails = targetExpense.getDetails().copy();
        this.proposedDetails = proposedDetails;
    }

    public static ExpenseReportVote ofEdit(
            Group group, GroupMember proposer, VotingModel votingModel, Expense targetExpense, ExpenseDetails proposedDetails
    ) {
        return new ExpenseReportVote(group, proposer, votingModel, targetExpense, Action.EDIT, proposedDetails);
    }

    public static ExpenseReportVote ofDeletion(
            Group group, GroupMember proposer, VotingModel votingModel, Expense targetExpense
    ) {
        return new ExpenseReportVote(group, proposer, votingModel, targetExpense, Action.DELETE, null);
    }
}
