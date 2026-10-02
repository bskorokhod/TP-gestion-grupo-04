package EsNuestro.reservation.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ReservationCreateDTO(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
) {
}
