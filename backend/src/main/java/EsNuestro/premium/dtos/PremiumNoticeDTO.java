package EsNuestro.premium.dtos;

import EsNuestro.premium.PremiumNoticeType;

import java.time.Instant;

/**
 * Aviso pendiente de ver para el caller. {@code youArePayer} dice si el caller es quien tiene contratado el plan (el
 * mensaje de una cancelación le aclara que su próximo cobro quedó cancelado).
 */
public record PremiumNoticeDTO(
        Long id,
        PremiumNoticeType type,
        String actorName,
        String payerName,
        boolean youArePayer,
        Instant until,
        Instant occurredAt
) {
}
