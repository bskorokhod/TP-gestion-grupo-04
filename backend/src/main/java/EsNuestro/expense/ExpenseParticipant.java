package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import jakarta.persistence.Embeddable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Integrante del reparto de un gasto: un miembro al que se le asigna una parte como deudor.
 */
@Embeddable
@NoArgsConstructor
@Getter
public class ExpenseParticipant {

    @ManyToOne(optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private GroupMember member;

    public ExpenseParticipant(GroupMember member) {
        this.member = member;
    }
}
