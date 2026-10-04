package EsNuestro.vote;

import EsNuestro.expense.ExpenseDetails;
import EsNuestro.group.Group;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Se vota si crear un gasto que alcanza el umbral extraordinario. Los involucrados (los que votan) son
 * el acreedor y los participantes del gasto propuesto. Si resulta positiva se crea el gasto con estos
 * datos; si no, simplemente no se crea.
 */
@Entity
@Table(name = "extraordinary_expense_votes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class ExtraordinaryExpenseVote extends Vote {

    /** Datos propuestos; al aprobarse se crea el gasto con una copia (el gasto no comparte esta fila). */
    @OneToOne(optional = false, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "proposed_details_id", nullable = false)
    private ExpenseDetails proposedDetails;

    public ExtraordinaryExpenseVote(
            Group group, GroupMember proposer, VotingModel votingModel, ExpenseDetails proposedDetails
    ) {
        super(group, proposer, VoteType.EXTRAORDINARY_EXPENSE, votingModel);
        this.proposedDetails = proposedDetails;
    }
}
