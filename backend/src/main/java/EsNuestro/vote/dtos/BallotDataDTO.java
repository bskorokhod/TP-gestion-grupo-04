package EsNuestro.vote.dtos;

import EsNuestro.vote.VoteChoice;
import jakarta.validation.constraints.NotNull;

/** Voto del caller; si ya había votado, reemplaza su voto anterior. */
public record BallotDataDTO(
        @NotNull(message = "El voto es obligatorio") VoteChoice choice
) {
}
