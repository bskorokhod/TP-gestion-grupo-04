package EsNuestro.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByGroup_IdOrderByStartDateAsc(Long groupId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Reservation> findWithLockById(Long id);

    /** Reservas de un miembro en el estado dado que no terminaron antes de {@code today}. */
    List<Reservation> findByMember_IdAndStatusAndEndDateGreaterThanEqual(
            Long memberId, ReservationStatus status, LocalDate today
    );

    boolean existsByIdAndGroup_Id(Long id, Long groupId);
}
