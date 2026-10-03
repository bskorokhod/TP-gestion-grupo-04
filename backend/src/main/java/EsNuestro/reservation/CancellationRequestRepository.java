package EsNuestro.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CancellationRequestRepository extends JpaRepository<CancellationRequest, Long> {
    Optional<CancellationRequest> findByReservation_IdAndStatus(
            Long reservationId,
            CancellationRequestStatus status
    );

    List<CancellationRequest> findByReservation_Group_IdOrderByCreatedAtDesc(Long groupId);
}
