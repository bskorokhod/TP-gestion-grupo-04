package EsNuestro.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DebtRepository extends JpaRepository<Debt, Long> {

    /** Deudas propias sin saldar por completo, activas o suspendidas. */
    @Query("select case when count(d) > 0 then true else false end "
            + "from Debt d where d.debtor.id = :memberId and d.paidAmount < d.amount")
    boolean existsUnsettledByDebtorId(@Param("memberId") Long memberId);

    /**
     * Todas las deudas de {@code memberId} como deudor en los gastos del grupo que están en el estado {@code status}.
     * Trae el gasto, sus datos, el acreedor y los pagos en la misma consulta para no hacer una por deuda. Qué deudas
     * cuentan como pagadas lo decide {@link Debt#isPaidShare()}; el orden lo da quien consulta.
     */
    @Query("""
            select distinct d from Debt d
              join fetch d.expense e
              join fetch e.details det
              join fetch det.creditor c
              join fetch c.user
              left join fetch d.payments
            where e.group.id = :groupId
              and e.status = :status
              and d.debtor.id = :memberId
            """)
    List<Debt> findByDebtorInGroupAndExpenseStatus(
            @Param("groupId") Long groupId,
            @Param("memberId") Long memberId,
            @Param("status") ExpenseStatus status
    );
}
