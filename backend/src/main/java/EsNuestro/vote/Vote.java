package EsNuestro.vote;

import EsNuestro.group.Group;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Votación de un grupo. Cada subclase aporta lo que se está votando (el "qué"); la acción que se
 * ejecuta si resulta positiva depende del tipo y la resuelve un {@code VoteExecutor}. Si resulta
 * negativa no se ejecuta nada.
 * <p>
 * Una votación finalizada no se borra (borrado lógico): conserva su resultado para el historial.
 * El modelo de votación se fija al crearla, de modo que cambiar la configuración del grupo mientras
 * se vota no altera las reglas de una votación en curso. Las transiciones son cambios de estado puros;
 * las precondiciones y la ejecución las maneja {@code VoteService}.
 */
@Entity
@Table(name = "votes")
@Inheritance(strategy = InheritanceType.JOINED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public abstract class Vote {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "proposer_id", nullable = false)
    private GroupMember proposer;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VoteType type;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VotingModel votingModel;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VoteStatus status;

    @Enumerated(EnumType.STRING)
    private VoteOutcome outcome;

    @Column(length = 300)
    private String failureReason;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant finalizedAt;

    @OneToMany(mappedBy = "vote", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Ballot> ballots = new ArrayList<>();

    protected Vote(Group group, GroupMember proposer, VoteType type, VotingModel votingModel) {
        this.group = group;
        this.proposer = proposer;
        this.type = type;
        this.votingModel = votingModel;
        this.status = VoteStatus.ACTIVE;
        this.createdAt = Instant.now();
    }

    public void addBallot(GroupMember member, BigDecimal weight) {
        ballots.add(new Ballot(this, member, weight));
    }

    public Optional<Ballot> ballotOf(GroupMember member) {
        return ballots.stream()
                .filter(ballot -> ballot.getMember().getId().equals(member.getId()))
                .findFirst();
    }

    public boolean hasBallotOf(Long memberId) {
        return ballots.stream().anyMatch(ballot -> ballot.getMember().getId().equals(memberId));
    }

    /** Quién puede ver la votación mientras está activa: quien la propuso y los involucrados. */
    public boolean isVisibleTo(GroupMember member) {
        return proposer.getId().equals(member.getId()) || hasBallotOf(member.getId());
    }

    /** Solo cuentan los miembros que siguen activos: quien dejó el grupo ya no vota ni pesa. */
    public List<Ballot> eligibleBallots() {
        return ballots.stream().filter(ballot -> ballot.getMember().isActive()).toList();
    }

    public List<VoteTally.Entry> tallyEntries() {
        return eligibleBallots().stream()
                .map(ballot -> new VoteTally.Entry(ballot.getWeight(), ballot.getChoice()))
                .toList();
    }

    public boolean isActive() {
        return status == VoteStatus.ACTIVE;
    }

    public void finalizeWith(VoteOutcome outcome, String failureReason) {
        if (!isActive()) {
            throw new IllegalStateException("The vote is already finalized");
        }
        this.status = VoteStatus.FINALIZED;
        this.outcome = outcome;
        this.failureReason = failureReason;
        this.finalizedAt = Instant.now();
    }
}
