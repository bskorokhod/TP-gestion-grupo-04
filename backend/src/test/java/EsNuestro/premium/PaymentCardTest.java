package EsNuestro.premium;

import EsNuestro.premium.dtos.PremiumSubscribeDTO;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentCardTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 7);

    private static PremiumSubscribeDTO data(String number, String expiration) {
        return new PremiumSubscribeDTO("  Ana Perez ", number, expiration, "123");
    }

    @Test
    void keepsOnlyHolderLastFourAndExpiration() {
        PaymentCard card = PaymentCard.from(data("4242 4242 4242 4242", "12/28"), TODAY);

        assertThat(card.holderName()).isEqualTo("Ana Perez");
        assertThat(card.last4()).isEqualTo("4242");
        assertThat(card.expirationMonth()).isEqualTo(12);
        assertThat(card.expirationYear()).isEqualTo(2028);
    }

    @Test
    void acceptsDashesAsSeparators() {
        assertThat(PaymentCard.from(data("4242-4242-4242-1111", "12/28"), TODAY).last4()).isEqualTo("1111");
    }

    @Test
    void rejectsNumbersWithTooFewOrTooManyDigits() {
        assertThatThrownBy(() -> PaymentCard.from(data("4242 4242 4242", "12/28"), TODAY))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> PaymentCard.from(data("1".repeat(20), "12/28"), TODAY))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aCardIsValidUntilTheEndOfItsExpirationMonth() {
        assertThat(PaymentCard.from(data("4242424242424242", "11/26"), TODAY).expirationYear()).isEqualTo(2026);
    }

    @Test
    void rejectsExpiredCards() {
        assertThatThrownBy(() -> PaymentCard.from(data("4242424242424242", "10/26"), TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void rejectsMalformedExpirations() {
        assertThatThrownBy(() -> PaymentCard.from(data("4242424242424242", "13/28"), TODAY))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void theDtoNeverPrintsCardData() {
        assertThat(data("4242424242424242", "12/28").toString())
                .doesNotContain("4242")
                .doesNotContain("123")
                .doesNotContain("Ana");
    }
}
