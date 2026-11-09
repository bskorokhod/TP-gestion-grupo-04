package EsNuestro.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface DebtRepository extends JpaRepository<Debt, Long> {

    /** Deudas propias sin saldar por completo, activas o suspendidas; las canceladas no cuentan. */
    @Query("select case when count(d) > 0 then true else false end "
            + "from Debt d where d.debtor.id = :memberId and d.paidAmount < d.amount "
            + "and d.status <> EsNuestro.expense.DebtStatus.CANCELED")
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

    /**
     * Deudas sin saldar de los gastos del grupo que todavía se pueden cobrar (activas o suspendidas), con el gasto, el
     * acreedor del gasto y el deudor cargados. Quien llama filtra por acreedor, porque en las devoluciones el acreedor
     * es {@code refundTo} y no el del gasto.
     */
    @Query("""
            select distinct d from Debt d
              join fetch d.expense e
              join fetch e.details det
              join fetch det.creditor
              join fetch d.debtor
            where e.group.id = :groupId
              and d.status <> EsNuestro.expense.DebtStatus.CANCELED
              and d.paidAmount < d.amount
            """)
    List<Debt> findCollectableByGroupId(@Param("groupId") Long groupId);

    /**
     * Las deudas con al menos un pago de los gastos dados, con los pagos y el deudor (y su usuario, por la foto) ya
     * cargados. Es una consulta aparte de la de los gastos porque {@code Expense.debts} y {@code Debt.payments} son
     * listas y Hibernate no deja traer dos en una misma consulta. El {@code join fetch} de los pagos es interno a
     * propósito: las deudas sin pagos no aportan comprobantes. Quien llama no debe pasar una colección vacía.
     */
    @Query("""
            select distinct d from Debt d
              join fetch d.payments
              join fetch d.debtor db
              join fetch db.user
            where d.expense.id in :expenseIds
            """)
    List<Debt> findWithPaymentsByExpenseIds(@Param("expenseIds") Collection<Long> expenseIds);
}
