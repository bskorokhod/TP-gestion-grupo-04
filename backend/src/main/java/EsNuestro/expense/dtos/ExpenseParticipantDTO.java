package EsNuestro.expense.dtos;

import jakarta.validation.constraints.NotNull;

/**
 * Participante del reparto de un gasto: el miembro al que se le asigna una parte como deudor.
 */
public record ExpenseParticipantDTO(
        @NotNull Long memberId
) {
}
