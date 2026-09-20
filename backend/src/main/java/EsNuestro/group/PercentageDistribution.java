package EsNuestro.group;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Reglas de reparto de porcentajes de propiedad: los miembros que conservan
 * participación deben sumar exactamente 100 tras aplicar los cambios pedidos.
 */
final class PercentageDistribution {

    private static final BigDecimal TOTAL = BigDecimal.valueOf(100);

    private PercentageDistribution() {
    }

    static Map<Long, BigDecimal> toMap(List<PercentageEntryDTO> entries) {
        Map<Long, BigDecimal> percentageByMemberId = new HashMap<>();
        for (PercentageEntryDTO entry : entries) {
            if (percentageByMemberId.put(entry.memberId(), entry.percentage()) != null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate member id in percentages payload");
            }
        }
        return percentageByMemberId;
    }

    static void requireTotalOfOneHundred(Collection<GroupMember> holders, Map<Long, BigDecimal> changes) {
        BigDecimal total = holders.stream()
                .map(member -> changes.getOrDefault(member.getId(), member.getPercentage()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(TOTAL) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Percentages must add up to exactly 100, got " + total
            );
        }
    }
}