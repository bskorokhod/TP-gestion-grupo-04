package EsNuestro.group.dtos;

import java.math.BigDecimal;
import java.util.List;

/**
 * Qué pasaría si el caller abandonara el grupo. {@code hasUnsettledDebts} indica si el caller debe plata (en ese caso
 * no puede abandonar). {@code owedToMe} es lo que le deben y perdería al irse, agrupado por deudor, con el monto
 * pendiente (lo que falta pagar, no el total de la deuda); {@code owedToMeTotal} es la suma. {@code groupWillStop} y
 * {@code missingPercentage} dicen si el grupo quedaría detenido tras la salida y cuánto porcentaje quedaría libre.
 */
public record LeavePreviewDTO(
        boolean hasUnsettledDebts,
        BigDecimal owedToMeTotal,
        List<OwedToMe> owedToMe,
        boolean groupWillStop,
        BigDecimal missingPercentage
) {
    public record OwedToMe(Long debtorMemberId, String debtorNickname, BigDecimal amount) {
    }
}
