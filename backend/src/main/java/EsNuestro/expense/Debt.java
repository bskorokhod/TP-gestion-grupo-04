package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Deuda de un miembro con el acreedor de un gasto. El acreedor no se guarda acá: es el del gasto
 * ({@link #getCreditor()}). {@code paidAmount} es el punto de extensión para el futuro módulo de
 * pagos: cualquier valor mayor a cero bloquea la edición y eliminación del gasto.
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

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DebtStatus status;

    @OneToMany(mappedBy = "debt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments = new ArrayList<>();

    private Debt(Expense expense, GroupMember debtor, BigDecimal amount) {
        this.expense = expense;
        this.debtor = debtor;
        this.amount = amount;
        this.status = DebtStatus.ACTIVE;
    }

    static Debt of(Expense expense, GroupMember debtor, BigDecimal amount) {
        return new Debt(expense, debtor, amount);
    }

    void suspend() {
        this.status = DebtStatus.SUSPENDED;
    }

    void reactivate() {
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

    public GroupMember getCreditor() {
        return expense.getDetails().getCreditor();
    }

    public boolean hasPayments() {
        return paidAmount.signum() > 0;
    }

    public boolean isUnsettled() {
        return paidAmount.compareTo(amount) < 0;
    }
}
