package EsNuestro.expense;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByGroup_IdOrderByCreatedAtDesc(Long groupId);

    /**
     * Gastos del grupo en el estado {@code status} sin ninguna deuda pendiente (ninguna con {@code paidAmount < amount},
     * incluidas las devoluciones), del más nuevo al más viejo. Un gasto sin deudas, porque no tiene participantes,
     * cuenta como saldado. Trae los datos y el acreedor en la misma consulta para no hacer una por gasto.
     */
    @Query("""
            select e from Expense e
              join fetch e.details d
              join fetch d.creditor c
              join fetch c.user
            where e.group.id = :groupId
              and e.status = :status
              and not exists (
                select debt.id from Debt debt
                where debt.expense = e and debt.paidAmount < debt.amount
              )
            order by e.createdAt desc, e.id desc
            """)
    List<Expense> findSettledByGroupId(@Param("groupId") Long groupId, @Param("status") ExpenseStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Expense> findWithLockById(Long id);
}
