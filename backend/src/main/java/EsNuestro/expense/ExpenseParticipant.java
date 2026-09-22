package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Integrante del reparto de un gasto. {@code customPercentage} solo se usa con
 * {@link SplitMethod#CUSTOM}; en los demás métodos es null.
 */
@Embeddable
@NoArgsConstructor
@Getter
public class ExpenseParticipant {

    @ManyToOne(optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private GroupMember member;

    @Column(precision = 5, scale = 2)
    private BigDecimal customPercentage;

    public ExpenseParticipant(GroupMember member, BigDecimal customPercentage) {
        this.member = member;
        this.customPercentage = customPercentage;
    }
}
