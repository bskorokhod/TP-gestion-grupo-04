package EsNuestro.expense;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Pago parcial o total autodeclarado por el deudor sobre una {@link Debt}. Queda registrado con su
 * comprobante para que un admin o el acreedor puedan revisarlo y reclamarlo más adelante si
 * corresponde; esa revisión todavía no está implementada, este pago se asume válido al crearse.
 */
@Entity
@Table(name = "payments")
@NoArgsConstructor
@Getter
public class Payment {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "debt_id", nullable = false)
    private Debt debt;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 2048)
    private String receiptUrl;

    @Column(nullable = false)
    private Instant paidAt;

    private Payment(Debt debt, BigDecimal amount, String receiptUrl) {
        this.debt = debt;
        this.amount = amount;
        this.receiptUrl = receiptUrl;
        this.paidAt = Instant.now();
    }

    static Payment of(Debt debt, BigDecimal amount, String receiptUrl) {
        return new Payment(debt, amount, receiptUrl);
    }
}
