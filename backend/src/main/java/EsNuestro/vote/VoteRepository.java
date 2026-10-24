package EsNuestro.vote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

/**
 * Sin {@code findWithLockById}: sobre una jerarquía JOINED el lock pesimista genera un
 * {@code SELECT ... FOR UPDATE} con outer joins, que PostgreSQL rechaza. No hace falta: toda operación
 * que modifica una votación ya tomó el lock de su grupo, que las serializa.
 */
interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> findByGroup_IdAndStatusOrderByCreatedAtDesc(Long groupId, VoteStatus status);

    /**
     * Grupos con algún reclamo de reserva en ese estado cuya reserva ya comenzó (su inicio es hoy o antes).
     */
    @Query("""
            select distinct v.group.id from ReservationClaimVote v
            where v.status = :status and v.cancellationRequest.reservation.startDate <= :today
            """)
    List<Long> findGroupIdsWithClaimsOfReservationsStartedBy(
            @Param("status") VoteStatus status, @Param("today") LocalDate today
    );

    /**
     * Una consulta por tipo y otra sin filtrarlo, en lugar de un {@code :type is null or ...}: con un enum nulo
     * PostgreSQL no puede inferir el tipo del parámetro. El orden lo trae el {@code Pageable}.
     */
    Page<Vote> findByGroup_IdAndStatus(Long groupId, VoteStatus status, Pageable pageable);

    Page<Vote> findByGroup_IdAndStatusAndType(Long groupId, VoteStatus status, VoteType type, Pageable pageable);

    long countByGroup_IdAndStatusAndOutcomeIn(Long groupId, VoteStatus status, Collection<VoteOutcome> outcomes);
}
