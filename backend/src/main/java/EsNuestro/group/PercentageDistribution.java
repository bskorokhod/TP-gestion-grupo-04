package EsNuestro.group;

import EsNuestro.member.GroupMember;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Objects;

/**
 * Reglas de los porcentajes de propiedad en modo porcentual: cada porcentaje es mayor a 0 y hasta 100 (con
 * a lo sumo 2 decimales) y la suma de los miembros activos nunca supera 100. Que sea menor a 100 es válido:
 * el grupo queda detenido (ver {@link Group#getStatus()}).
 */
final class PercentageDistribution {

    static final String JOIN_BLOCKED_MESSAGE = "You can't join with that percentage. Contact a group member";

    private static final BigDecimal TOTAL = Group.TOTAL_PERCENTAGE;
    private static final int MAX_DECIMALS = 2;

    private PercentageDistribution() {
    }

    /**
     * Valida el valor y lo devuelve normalizado a 2 decimales. Se rechaza (y no se redondea) lo que tenga más
     * decimales: 0.001 se redondearía a 0.00, un porcentaje nulo.
     */
    static BigDecimal requireValidPercentage(BigDecimal percentage) {
        if (percentage == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The percentage is required");
        }
        if (percentage.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Negative percentages cannot be assigned");
        }
        if (percentage.signum() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Zero percentages cannot be assigned");
        }
        if (percentage.compareTo(TOTAL) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Percentages greater than 100% cannot be assigned");
        }
        if (percentage.stripTrailingZeros().scale() > MAX_DECIMALS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The percentage allows up to two decimal places");
        }
        return percentage.setScale(MAX_DECIMALS);
    }

    /**
     * Rechaza el cambio si, con {@code member} en {@code newPercentage}, los activos superarían 100.
     */
    static void requireWithinTotalAfterChange(
            Collection<GroupMember> activeMembers, GroupMember member, BigDecimal newPercentage
    ) {
        BigDecimal total = activeMembers.stream()
                .filter(other -> other != member)
                .map(GroupMember::getPercentage)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(newPercentage);

        if (total.compareTo(TOTAL) > 0) {
            BigDecimal excess = total.subtract(TOTAL);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You exceeded the limit by " + format(excess) + "%");
        }
    }

    /**
     * Rechaza una solicitud de unión que haría superar 100. El mensaje es el mismo con el grupo detenido o
     * funcionando, y no revela el estado ni cuánto porcentaje queda disponible.
     */
    static void requireRoomToJoin(Group group, BigDecimal requestedPercentage) {
        if (group.assignedPercentage().add(requestedPercentage).compareTo(TOTAL) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, JOIN_BLOCKED_MESSAGE);
        }
    }

    static String format(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }
}