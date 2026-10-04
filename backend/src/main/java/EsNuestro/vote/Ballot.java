package EsNuestro.vote;

import EsNuestro.member.GroupMember;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Lugar de un miembro involucrado en una votación. Se crea sin elección al abrir la votación (así quedan
 * fijados los miembros que votan) y {@code choice} se puede cambiar mientras la votación siga activa.
 * {@code weight} es el porcentaje de propiedad del miembro al abrir la votación; solo cuenta en la
 * mayoría ponderada (ver {@link VoteTally}).
 */
@Entity
@Table(name = "vote_ballots", uniqueConstraints = @UniqueConstraint(name = "uk_vote_ballot_member", columnNames = {"vote_id", "member_id"}))
@NoArgsConstructor
@Getter
public class Ballot {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "vote_id", nullable = false)
    private Vote vote;

    @ManyToOne(optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private GroupMember member;

    @Column(nullable = false, precision = 7, scale = 2)
    private BigDecimal weight;

    @Enumerated(EnumType.STRING)
    private VoteChoice choice;

    private Instant castAt;

    Ballot(Vote vote, GroupMember member, BigDecimal weight) {
        this.vote = vote;
        this.member = member;
        this.weight = weight;
    }

    public void cast(VoteChoice choice) {
        this.choice = choice;
        this.castAt = Instant.now();
    }
}
