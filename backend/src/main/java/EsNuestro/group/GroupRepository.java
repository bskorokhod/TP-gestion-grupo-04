package EsNuestro.group;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByJoinCode(String joinCode);

    boolean existsByJoinCode(String joinCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Group> findWithLockById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Group> findWithLockByJoinCode(String joinCode);
}