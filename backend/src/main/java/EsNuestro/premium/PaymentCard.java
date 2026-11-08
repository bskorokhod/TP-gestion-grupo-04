package EsNuestro.premium;

import EsNuestro.premium.dtos.PremiumSubscribeDTO;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.regex.Pattern;

/**
 * Lo único de la tarjeta que se guarda: titular, últimos 4 dígitos y vencimiento. El número completo y el código de
 * seguridad se validan acá y se descartan; no hay forma de persistirlos desde este tipo.
 * <p>
 * Como el cobro es simulado, {@code declines} marca las tarjetas de prueba que la "pasarela" rechaza siempre: las que
 * terminan en {@value #DECLINED_CARD_SUFFIX}. Permite demostrar el pago rechazado (al activar o mejorar el plan, no
 * cambia nada) y el débito fallido (al terminar la prueba o renovar, el grupo vuelve al plan gratuito).
 */
record PaymentCard(String holderName, String last4, int expirationMonth, int expirationYear, boolean declines) {

    static final String DECLINED_CARD_SUFFIX = "0002";

    private static final Pattern NUMBER_SEPARATORS = Pattern.compile("[ -]");
    private static final Pattern DIGITS = Pattern.compile("[0-9]{13,19}");
    private static final Pattern EXPIRATION = Pattern.compile("(0[1-9]|1[0-2])/([0-9]{2})");

    /** La tarjeta vale hasta el último día del mes de vencimiento. */
    static PaymentCard from(PremiumSubscribeDTO data, LocalDate today) {
        String number = NUMBER_SEPARATORS.matcher(data.cardNumber()).replaceAll("");
        if (!DIGITS.matcher(number).matches()) {
            throw new IllegalArgumentException("The card number must have between 13 and 19 digits");
        }

        var expirationMatcher = EXPIRATION.matcher(data.expiration());
        if (!expirationMatcher.matches()) {
            throw new IllegalArgumentException("The expiration must have the format MM/YY");
        }
        YearMonth expiration = YearMonth.of(
                2000 + Integer.parseInt(expirationMatcher.group(2)),
                Integer.parseInt(expirationMatcher.group(1))
        );
        if (expiration.isBefore(YearMonth.from(today))) {
            throw new IllegalArgumentException("The card is expired");
        }

        return new PaymentCard(
                data.cardholderName().strip(),
                number.substring(number.length() - 4),
                expiration.getMonthValue(),
                expiration.getYear(),
                number.endsWith(DECLINED_CARD_SUFFIX)
        );
    }
}
