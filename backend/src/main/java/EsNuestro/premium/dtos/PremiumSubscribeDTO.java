package EsNuestro.premium.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos del formulario de pago (simulado: no hay cobro real ni pasarela externa). El número completo y el código
 * de seguridad solo se validan: nunca se persisten ni se loguean (ver {@code PaymentCard}). Por eso el
 * {@code toString} no muestra ningún campo.
 */
public record PremiumSubscribeDTO(
        @NotBlank @Size(max = 100)
        String cardholderName,

        @NotBlank @Pattern(regexp = "[0-9 -]{13,23}", message = "The card number must have between 13 and 19 digits")
        String cardNumber,

        @NotBlank @Pattern(regexp = "(0[1-9]|1[0-2])/[0-9]{2}", message = "The expiration must have the format MM/YY")
        String expiration,

        @NotBlank @Pattern(regexp = "[0-9]{3,4}", message = "The security code must have 3 or 4 digits")
        String securityCode
) {
    @Override
    public String toString() {
        return "PremiumSubscribeDTO[redacted]";
    }
}
