package EsNuestro.reservation.dtos;

import EsNuestro.reservation.Reservation;
import EsNuestro.reservation.ReservationStatus;

import java.time.Instant;
import java.time.LocalDate;

public record ReservationDTO(
        Long id,
        Long groupId,
        Long memberId,
        String memberNickname,
        String memberColor,
        LocalDate startDate,
        LocalDate endDate,
        ReservationStatus status,
        Instant createdAt
) {
    public static ReservationDTO from(Reservation reservation) {
        return new ReservationDTO(
                reservation.getId(),
                reservation.getGroup().getId(),
                reservation.getMember().getId(),
                reservation.getMember().getNickname(),
                reservation.getMember().getColor().name(),
                reservation.getStartDate(),
                reservation.getEndDate(),
                reservation.getStatus(),
                reservation.getCreatedAt()
        );
    }
}
