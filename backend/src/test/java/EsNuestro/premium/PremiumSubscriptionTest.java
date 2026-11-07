package EsNuestro.premium;

import EsNuestro.group.Group;
import EsNuestro.premium.dtos.PremiumSubscribeDTO;
import EsNuestro.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class PremiumSubscriptionTest {

    private static final PaymentCard CARD = PaymentCard.from(
            new PremiumSubscribeDTO("Ana Perez", "4242424242424242", "12/99", "123"),
            LocalDate.of(2026, 11, 7)
    );

    private static Group group() {
        return new Group("Casa", "Casa de la playa", "ABC-1234-XYZ", null);
    }

    private static User user(long id) {
        User user = new User("pw", "USER", "Ana", "Perez", "ana" + id + "@mail.com", null, null);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    @Test
    void withTrialBillingStartsWhenTheTrialEndsAndTheTrialIsBoundToThePayer() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, true);

        assertThat(subscription.hasTrial()).isTrue();
        assertThat(subscription.getTrialUserId()).isEqualTo(7L);
        assertThat(Duration.between(subscription.getStartedAt(), subscription.getTrialEndsAt()))
                .isEqualTo(Duration.ofDays(PremiumSubscription.TRIAL_DAYS));
        assertThat(subscription.getNextBillingAt()).isEqualTo(subscription.getTrialEndsAt());
    }

    @Test
    void withoutTrialBillingStartsImmediatelyAndNoTrialIsConsumed() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, false);

        assertThat(subscription.hasTrial()).isFalse();
        assertThat(subscription.getTrialEndsAt()).isNull();
        assertThat(subscription.getTrialUserId()).isNull();
        assertThat(subscription.getNextBillingAt()).isEqualTo(subscription.getStartedAt());
    }

    @Test
    void onlyTheNonSensitiveCardDataIsKept() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, true);

        assertThat(subscription.getCardLast4()).isEqualTo("4242");
        assertThat(subscription.getCardholderName()).isEqualTo("Ana Perez");
        assertThat(subscription.getCardExpirationMonth()).isEqualTo(12);
        assertThat(subscription.getCardExpirationYear()).isEqualTo(2099);
    }
}
