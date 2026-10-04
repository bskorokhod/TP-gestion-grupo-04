package EsNuestro.vote.dtos;

import EsNuestro.expense.dtos.ExpenseMemberDTO;
import EsNuestro.reservation.CancellationRequest;
import EsNuestro.reservation.Reservation;
import EsNuestro.vote.ReservationClaimVote;

import java.time.LocalDate;

/**
 * Lo que se está votando en un reclamo: la reserva reclamada, su dueño y el motivo del reclamo.
 */
public record ReservationClaimDTO(
        Long reservationId,
        LocalDate startDate,
        LocalDate endDate,
        ExpenseMemberDTO owner,
        String reason
) {

    public static ReservationClaimDTO from(ReservationClaimVote vote) {
        CancellationRequest request = vote.getCancellationRequest();
        Reservation reservation = request.getReservation();
        return new ReservationClaimDTO(
                reservation.getId(),
                reservation.getStartDate(),
                reservation.getEndDate(),
                ExpenseMemberDTO.from(reservation.getMember()),
                request.getReason()
        );
    }
}