package EsNuestro.vote;

import EsNuestro.reservation.CancellationRequest;
import EsNuestro.reservation.Reservation;
import EsNuestro.reservation.ReservationStatus;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Al aprobarse, cancela la reserva reclamada y marca la solicitud como aprobada. Si la reserva ya no está
 * activa devuelve el motivo y la votación queda con resultado EXECUTION_FAILED. Si se rechaza, solo se marca
 * la solicitud como rechazada (así se puede volver a reclamar la reserva).
 */
@Component
class ReservationClaimVoteExecutor implements VoteExecutor {

    @Override
    public VoteType type() {
        return VoteType.RESERVATION_CLAIM;
    }

    @Override
    public Optional<String> execute(Vote vote) {
        CancellationRequest request = requestOf(vote);
        Reservation reservation = request.getReservation();

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            request.reject();
            return Optional.of("The reservation is no longer active");
        }
        reservation.cancel();
        request.approve();
        return Optional.empty();
    }

    @Override
    public void onRejected(Vote vote) {
        requestOf(vote).reject();
    }

    private CancellationRequest requestOf(Vote vote) {
        if (!(vote instanceof ReservationClaimVote claimVote)) {
            throw new IllegalStateException("Vote " + vote.getId() + " is not a reservation claim vote");
        }
        return claimVote.getCancellationRequest();
    }
}