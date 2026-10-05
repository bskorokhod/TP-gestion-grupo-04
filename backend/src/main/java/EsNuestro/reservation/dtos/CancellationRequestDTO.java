package EsNuestro.reservation.dtos;

import EsNuestro.reservation.CancellationRequest;
import EsNuestro.reservation.CancellationRequestStatus;

import java.time.Instant;

public record CancellationRequestDTO(
        Long id,
        Long reservationId,
        Long requesterId,
        String requesterNickname,
        String reason,
        CancellationRequestStatus status,
        Instant createdAt
) {
    public static CancellationRequestDTO from(CancellationRequest request) {
        return new CancellationRequestDTO(
                request.getId(),
                request.getReservation().getId(),
                request.getRequester().getId(),
                request.getRequester().getNickname(),
                request.getReason(),
                request.getStatus(),
                request.getCreatedAt()
        );
    }
}
