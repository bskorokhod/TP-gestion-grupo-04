package EsNuestro.expense.dtos;

import EsNuestro.expense.Debt;
import EsNuestro.expense.DebtKind;
import EsNuestro.expense.DebtStatus;
import EsNuestro.expense.Payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * {@code kind} distingue la parte de un participante (SHARE) de una devolución (REFUND), en la que el deudor es el
 * acreedor del gasto y el acreedor es quien pagó de más. {@code payments} son los pagos autodeclarados con su
 * comprobante, del más antiguo al más nuevo: el acreedor los usa para revisar lo que le declararon.
 */
public record DebtDTO(
        Long id,
        ExpenseMemberDTO debtor,
        ExpenseMemberDTO creditor,
        BigDecimal amount,
        BigDecimal paidAmount,
        DebtStatus status,
        DebtKind kind,
        List<PaymentDTO> payments
) {

    public record PaymentDTO(Long id, BigDecimal amount, String receiptUrl, Instant paidAt) {
        static PaymentDTO from(Payment payment) {
            return new PaymentDTO(payment.getId(), payment.getAmount(), payment.getReceiptUrl(), payment.getPaidAt());
        }
    }

    public static DebtDTO from(Debt debt) {
        return new DebtDTO(
                debt.getId(),
                ExpenseMemberDTO.from(debt.getDebtor()),
                ExpenseMemberDTO.from(debt.getCreditor()),
                debt.getAmount(),
                debt.getPaidAmount(),
                debt.getStatus(),
                debt.getKind(),
                debt.getPayments().stream().map(PaymentDTO::from).toList()
        );
    }
}
