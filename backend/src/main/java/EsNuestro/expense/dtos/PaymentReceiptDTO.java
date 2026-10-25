package EsNuestro.expense.dtos;

import EsNuestro.expense.Debt;
import EsNuestro.expense.Payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;

/**
 * Comprobante de un pago, con quién lo subió ({@code payer}, el deudor de la deuda sobre la que se pagó). Lo usan las
 * filas del historial para mostrar los comprobantes de pago; a diferencia de {@link DebtDTO.PaymentDTO} identifica al
 * pagador, porque ahí las filas no cuelgan de una deuda.
 */
public record PaymentReceiptDTO(
        Long id,
        ExpenseMemberDTO payer,
        BigDecimal amount,
        String receiptUrl,
        Instant paidAt
) {

    public static PaymentReceiptDTO from(Debt debt, Payment payment) {
        return new PaymentReceiptDTO(
                payment.getId(),
                ExpenseMemberDTO.from(debt.getDebtor()),
                payment.getAmount(),
                payment.getReceiptUrl(),
                payment.getPaidAt()
        );
    }

    /** Todos los pagos de las deudas dadas, del más antiguo al más nuevo. */
    public static List<PaymentReceiptDTO> fromDebts(Collection<Debt> debts) {
        return debts.stream()
                .flatMap(debt -> debt.getPayments().stream().map(payment -> from(debt, payment)))
                .sorted(Comparator.comparing(PaymentReceiptDTO::paidAt))
                .toList();
    }
}
