package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Cálculo de la parte de cada participante en un gasto. Todos los métodos reparten
 * {@code peso_i / Σ pesos}: el peso es 1 en EQUAL, el porcentaje de posesión en PROPORTIONAL y
 * el porcentaje indicado en CUSTOM. Como siempre se normaliza, con todos los miembros el
 * reparto proporcional coincide con la posesión base, y con un subconjunto los porcentajes
 * quedan reescalados a 100%.
 * <p>
 * Los importes se calculan en centavos con el método del mayor resto (desempate por id de
 * miembro ascendente), de modo que la suma de las partes es exactamente el total.
 */
final class ExpenseSplitCalculator {

    private static final BigDecimal TOTAL_PERCENTAGE = BigDecimal.valueOf(100);
    private static final BigDecimal TOLERANCE = new BigDecimal("0.01");
    private static final int CENT_DIGITS = 2;
    private static final int DIVISION_SCALE = 20;

    private ExpenseSplitCalculator() {
    }

    static void requireValidCustomPercentages(List<ExpenseParticipant> participants) {
        BigDecimal total = BigDecimal.ZERO;
        for (ExpenseParticipant participant : participants) {
            BigDecimal percentage = participant.getCustomPercentage();
            if (percentage == null
                    || percentage.signum() < 0
                    || percentage.compareTo(TOTAL_PERCENTAGE) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A custom split needs a percentage between 0 and 100 for every participant"
                );
            }
            total = total.add(percentage);
        }

        if (total.subtract(TOTAL_PERCENTAGE).abs().compareTo(TOLERANCE) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Custom percentages must add up to exactly 100, got " + total
            );
        }
    }

    /**
     * @return la parte de cada participante (id de miembro -> importe con 2 decimales), incluidas
     * las partes en cero y la del acreedor si participa; quien genera deudas lo decide el llamador.
     */
    static Map<Long, BigDecimal> split(BigDecimal total, SplitMethod method, List<ExpenseParticipant> participants) {
        Map<Long, BigDecimal> weights = weightsOf(method, participants);
        BigDecimal weightSum = weights.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        if (weightSum.signum() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The expense cannot be split: none of the participants has a share to divide it by"
            );
        }

        BigDecimal totalCents = total.movePointRight(CENT_DIGITS).setScale(0, RoundingMode.UNNECESSARY);
        Map<Long, BigDecimal> floors = new LinkedHashMap<>();
        Map<Long, BigDecimal> remainders = new HashMap<>();
        BigDecimal allocated = BigDecimal.ZERO;

        for (Map.Entry<Long, BigDecimal> weight : weights.entrySet()) {
            BigDecimal exact = totalCents.multiply(weight.getValue())
                    .divide(weightSum, DIVISION_SCALE, RoundingMode.DOWN);
            BigDecimal floor = exact.setScale(0, RoundingMode.DOWN);
            floors.put(weight.getKey(), floor);
            remainders.put(weight.getKey(), exact.subtract(floor));
            allocated = allocated.add(floor);
        }

        int leftoverCents = totalCents.subtract(allocated).intValueExact();
        Comparator<Long> byRemainderDescending = Comparator.comparing((Long id) -> remainders.get(id)).reversed();
        List<Long> extraCentRecipients = weights.entrySet().stream()
                .filter(weight -> weight.getValue().signum() > 0)
                .map(Map.Entry::getKey)
                .sorted(byRemainderDescending.thenComparing(Comparator.naturalOrder()))
                .limit(leftoverCents)
                .toList();

        Map<Long, BigDecimal> shares = new LinkedHashMap<>();
        floors.forEach((memberId, floor) -> {
            BigDecimal cents = extraCentRecipients.contains(memberId) ? floor.add(BigDecimal.ONE) : floor;
            shares.put(memberId, cents.movePointLeft(CENT_DIGITS));
        });
        return shares;
    }

    private static Map<Long, BigDecimal> weightsOf(SplitMethod method, List<ExpenseParticipant> participants) {
        Map<Long, BigDecimal> weights = new LinkedHashMap<>();
        for (ExpenseParticipant participant : participants) {
            GroupMember member = participant.getMember();
            BigDecimal weight = switch (method) {
                case EQUAL -> BigDecimal.ONE;
                case PROPORTIONAL -> member.getPercentage();
                case CUSTOM -> participant.getCustomPercentage();
            };
            if (weight == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Member '" + member.getNickname() + "' has no percentage to split by"
                );
            }
            weights.put(member.getId(), weight);
        }
        return weights;
    }
}
