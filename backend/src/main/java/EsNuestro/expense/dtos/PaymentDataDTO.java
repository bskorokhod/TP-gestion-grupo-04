package EsNuestro.expense.dtos;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * Pago autodeclarado por el deudor sobre una deuda puntual. {@code amount} puede ser parcial
 * (menor al saldo restante) o total.
 */
public record PaymentDataDTO(
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
        @NotBlank @Size(max = 2048) String receiptUrl
) {
}
