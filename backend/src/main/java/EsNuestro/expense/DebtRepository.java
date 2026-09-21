package EsNuestro.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DebtRepository extends JpaRepository<Debt, Long> {

    /** Deudas propias sin saldar por completo, activas o suspendidas. */
    @Query("select case when count(d) > 0 then true else false end "
            + "from Debt d where d.debtor.id = :memberId and d.paidAmount < d.amount")
    boolean existsUnsettledByDebtorId(@Param("memberId") Long memberId);
}
