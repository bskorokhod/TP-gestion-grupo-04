package EsNuestro.vote.dtos;

/**
 * Conteo del historial de un grupo. {@code rejected} incluye las votaciones que no se aprobaron: las rechazadas y las que
 * ganaron, pero ya no pudieron ejecutarse (EXECUTION_FAILED).
 */
public record FinishedVoteSummaryDTO(
        long approved,
        long rejected
) {
}
