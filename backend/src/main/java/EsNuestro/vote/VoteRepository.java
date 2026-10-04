package EsNuestro.vote;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Sin {@code findWithLockById}: sobre una jerarquía JOINED el lock pesimista genera un
 * {@code SELECT ... FOR UPDATE} con outer joins, que PostgreSQL rechaza. No hace falta: toda operación
 * que modifica una votación ya tomó el lock de su grupo, que las serializa.
 */
interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> findByGroup_IdAndStatusOrderByCreatedAtDesc(Long groupId, VoteStatus status);
}
