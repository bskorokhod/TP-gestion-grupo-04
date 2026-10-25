package EsNuestro.vote;

import EsNuestro.group.VotingModel;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Conteo de una votación en el instante en que finalizó. Se guarda aparte porque {@code Vote.eligibleBallots()} filtra
 * por los miembros activos de hoy: si alguien deja el grupo después, el conteo "en vivo" cambiaría y podría contradecir
 * el resultado ya definido. {@code decision} es lo que decidió el conteo en ese momento y es {@code OPEN} si la
 * votación se cerró sin que el conteo la resolviera (p. ej. el dueño canceló la reserva reclamada).
 */
@Embeddable
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class TallySnapshot {

    @Column(name = "final_yes_count")
    private Integer yesCount;

    @Column(name = "final_no_count")
    private Integer noCount;

    @Column(name = "final_pending_count")
    private Integer pendingCount;

    @Column(name = "final_yes_weight", precision = 7, scale = 2)
    private BigDecimal yesWeight;

    @Column(name = "final_no_weight", precision = 7, scale = 2)
    private BigDecimal noWeight;

    @Column(name = "final_pending_weight", precision = 7, scale = 2)
    private BigDecimal pendingWeight;

    @Column(name = "final_decision")
    @Enumerated(EnumType.STRING)
    private VoteTally.Result decision;

    public static TallySnapshot of(VotingModel votingModel, List<VoteTally.Entry> entries) {
        VoteTally.Totals totals = VoteTally.totals(votingModel, entries);

        TallySnapshot snapshot = new TallySnapshot();
        snapshot.yesCount = count(entries, VoteChoice.YES);
        snapshot.noCount = count(entries, VoteChoice.NO);
        snapshot.pendingCount = count(entries, null);
        snapshot.yesWeight = totals.yes();
        snapshot.noWeight = totals.no();
        snapshot.pendingWeight = totals.pending();
        snapshot.decision = VoteTally.evaluate(votingModel, entries);
        return snapshot;
    }

    private static int count(List<VoteTally.Entry> entries, VoteChoice choice) {
        return (int) entries.stream().filter(entry -> entry.choice() == choice).count();
    }
}
