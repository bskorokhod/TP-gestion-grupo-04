package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Deuda de un gasto. Hay de dos {@link DebtKind tipos}: la parte de un participante (el acreedor es el del gasto) y la
 * devolución que el acreedor le debe a quien pagó de más (el acreedor es {@link #getRefundTo()}).
 * <p>
 * {@code paidAmount} es lo que ya cuenta como pagado de esta deuda y nunca supera {@code amount}. En una parte puede
 * ser menor que la suma de sus {@link #getPayments() pagos}: si el gasto se modificó y el participante había pagado de
 * más, el exceso pasa a una devolución (ver {@link DebtReconciliation}). El historial de pagos nunca se borra.
 */
@Entity
@Table(name = "debts")
@NoArgsConstructor
@Getter
public class Debt {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(optional = false)
    @JoinColumn(name = "debtor_id", nullable = false)
    private GroupMember debtor;

    /** Nullable en la base para no romper deudas anteriores a este campo: null se interpreta como SHARE. */
    @Enumerated(EnumType.STRING)
    @Column(name = "kind")
    private DebtKind kind = DebtKind.SHARE;

    /** A quién se le debe, solo en las devoluciones; en las partes el acreedor es el del gasto. */
    @ManyToOne
    @JoinColumn(name = "refund_to_id")
    private GroupMember refundTo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DebtStatus status;

    @OneToMany(mappedBy = "debt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments = new ArrayList<>();

    private Debt(Expense expense, GroupMember debtor, GroupMember refundTo, DebtKind kind, BigDecimal amount) {
        this.expense = expense;
        this.debtor = debtor;
        this.refundTo = refundTo;
        this.kind = kind;
        this.amount = amount;
        this.status = DebtStatus.ACTIVE;
    }

    static Debt of(Expense expense, GroupMember debtor, BigDecimal amount) {
        return new Debt(expense, debtor, null, DebtKind.SHARE, amount);
    }

    /** Devolución de {@code expenseCreditor} (el acreedor del gasto) a {@code refundTo}, que pagó de más. */
    static Debt refund(Expense expense, GroupMember expenseCreditor, GroupMember refundTo, BigDecimal amount) {
        return new Debt(expense, expenseCreditor, refundTo, DebtKind.REFUND, amount);
    }

    void suspend() {
        this.status = DebtStatus.SUSPENDED;
    }

    void reactivate() {
        this.status = DebtStatus.ACTIVE;
    }

    /**
     * Fija el monto de la deuda y cuánto cuenta como pagado (ya conciliado, ver {@link DebtReconciliation}), y la
     * deja activa. No toca el historial de pagos.
     */
    void reconcileTo(BigDecimal newAmount, BigDecimal newPaidAmount) {
        this.amount = newAmount;
        this.paidAmount = newPaidAmount;
        this.status = DebtStatus.ACTIVE;
    }

    /**
     * Registra un pago autodeclarado por el deudor: suma el monto a {@code paidAmount} y guarda el
     * comprobante en el historial. No valida montos ni estado; eso lo hace {@code ExpenseService}.
     */
    void registerPayment(BigDecimal amount, String receiptUrl) {
        this.payments.add(Payment.of(this, amount, receiptUrl));
        this.paidAmount = this.paidAmount.add(amount);
    }

    public DebtKind getKind() {
        return kind == null ? DebtKind.SHARE : kind;
    }

    public boolean isRefund() {
        return getKind() == DebtKind.REFUND;
    }

    public GroupMember getCreditor() {
        return isRefund() ? refundTo : expense.getDetails().getCreditor();
    }

    /** Suma de todos los pagos registrados sobre esta deuda, aunque parte ya no cuente como pagada de la parte. */
    BigDecimal paymentsTotal() {
        return payments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Si alguna vez se registró un pago; no depende de cuánto cuente hoy como pagado. */
    public boolean hasPayments() {
        return !payments.isEmpty();
    }

    public boolean isUnsettled() {
        return paidAmount.compareTo(amount) < 0;
    }
}
