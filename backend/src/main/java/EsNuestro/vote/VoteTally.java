package EsNuestro.vote;

import EsNuestro.group.VotingModel;

import java.math.BigDecimal;
import java.util.List;

/**
 * Regla de quórum, sin JPA ni Spring: dado el modelo de votación y los votos de los miembros
 * elegibles, decide si la votación se aprobó, se rechazó o sigue abierta.
 * <p>
 * Una votación se cierra apenas su resultado queda determinado, sin esperar a que voten todos:
 * <ul>
 *   <li>UNANIMOUS: un solo "no" la rechaza; se aprueba cuando todos votaron "sí".</li>
 *   <li>SIMPLE_MAJORITY / OWNERSHIP_WEIGHTED_MAJORITY: se aprueba si el peso a favor supera estrictamente
 *   la mitad del peso total; se rechaza apenas ya no puede superarla, aun si votaran "sí" todos los
 *   pendientes. Por eso un empate exacto 50/50 es un rechazo.</li>
 * </ul>
 * El peso es 1 por miembro, salvo en la mayoría ponderada, donde es el porcentaje de propiedad que el
 * miembro tenía al crearse la votación. Si en la ponderada todos los pesos son cero, no hay a quién
 * ponderar y se cuenta un voto por miembro.
 */
public final class VoteTally {

    private static final BigDecimal TWO = BigDecimal.valueOf(2);

    private VoteTally() {
    }

    public enum Result {
        APPROVED,
        REJECTED,
        OPEN
    }

    /** Voto de un miembro elegible; {@code choice} es null si todavía no votó. */
    public record Entry(BigDecimal weight, VoteChoice choice) {
    }

    public record Totals(BigDecimal yes, BigDecimal no, BigDecimal pending) {
        public BigDecimal total() {
            return yes.add(no).add(pending);
        }
    }

    public static Totals totals(VotingModel model, List<Entry> entries) {
        boolean weighted = model == VotingModel.OWNERSHIP_WEIGHTED_MAJORITY
                && entries.stream().anyMatch(entry -> entry.weight().signum() > 0);

        BigDecimal yes = BigDecimal.ZERO;
        BigDecimal no = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;
        for (Entry entry : entries) {
            BigDecimal weight = weighted ? entry.weight() : BigDecimal.ONE;
            if (entry.choice() == VoteChoice.YES) {
                yes = yes.add(weight);
            } else if (entry.choice() == VoteChoice.NO) {
                no = no.add(weight);
            } else {
                pending = pending.add(weight);
            }
        }
        return new Totals(yes, no, pending);
    }

    public static Result evaluate(VotingModel model, List<Entry> entries) {
        if (entries.isEmpty()) {
            // Nadie puede aprobar (p. ej. todos los involucrados dejaron el grupo).
            return Result.REJECTED;
        }

        Totals totals = totals(model, entries);

        if (model == VotingModel.UNANIMOUS) {
            if (totals.no().signum() > 0) {
                return Result.REJECTED;
            }
            return totals.pending().signum() == 0 ? Result.APPROVED : Result.OPEN;
        }

        BigDecimal total = totals.total();
        if (totals.yes().multiply(TWO).compareTo(total) > 0) {
            return Result.APPROVED;
        }
        if (totals.yes().add(totals.pending()).multiply(TWO).compareTo(total) <= 0) {
            return Result.REJECTED;
        }
        return Result.OPEN;
    }
}
