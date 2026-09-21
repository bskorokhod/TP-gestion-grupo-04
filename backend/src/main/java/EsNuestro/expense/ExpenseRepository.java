package EsNuestro.expense;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByGroup_IdOrderByCreatedAtDesc(Long groupId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Expense> findWithLockById(Long id);
}
