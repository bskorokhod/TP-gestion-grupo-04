package EsNuestro.premium;

import EsNuestro.group.Group;
import EsNuestro.premium.dtos.PremiumSubscribeDTO;
import EsNuestro.premium.dtos.PremiumSubscriptionDTO;
import EsNuestro.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

        assertThat(subscription.isActive()).isTrue();
        assertThat(subscription.hasTrial()).isTrue();
        assertThat(subscription.startedWithTrial()).isTrue();
        assertThat(subscription.getTrialUserId()).isEqualTo(7L);
        assertThat(Duration.between(subscription.getStartedAt(), subscription.getTrialEndsAt()))
                .isEqualTo(Duration.ofDays(PremiumSubscription.TRIAL_DAYS));
        assertThat(subscription.getNextBillingAt()).isEqualTo(subscription.getTrialEndsAt());
    }

    @Test
    void withoutTrialBillingStartsImmediatelyAndNoTrialIsConsumed() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, false);

        assertThat(subscription.hasTrial()).isFalse();
        assertThat(subscription.startedWithTrial()).isFalse();
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

    @Test
    void cancellingClosesTheSubscription() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, true);

        subscription.cancel();

        assertThat(subscription.isActive()).isFalse();
        assertThat(subscription.getStatus()).isEqualTo(PremiumSubscriptionStatus.CANCELLED);
        assertThat(subscription.getCancelledAt()).isNotNull();
    }

    @Test
    void cancellingDoesNotGiveTheTrialBack() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, true);

        subscription.cancel();

        assertThat(subscription.hasTrial()).isTrue();
        assertThat(subscription.getTrialUserId()).isEqualTo(7L);
    }

    @Test
    void aCancelledSubscriptionCannotBeCancelledAgain() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, false);
        subscription.cancel();

        assertThatThrownBy(subscription::cancel).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void resumingWithoutTrialKeepsTheGroupsTrialRecord() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, true);
        subscription.cancel();

        subscription.resume(user(8), CARD, false);

        assertThat(subscription.isActive()).isTrue();
        assertThat(subscription.getPayer().getId()).isEqualTo(8L);
        assertThat(subscription.getCancelledAt()).isNull();
        assertThat(subscription.startedWithTrial()).isFalse();
        assertThat(subscription.hasTrial()).isTrue();
        assertThat(subscription.getTrialUserId()).isEqualTo(7L);
        assertThat(subscription.getNextBillingAt()).isEqualTo(subscription.getStartedAt());
    }

    @Test
    void aGroupThatNeverHadATrialCanGetItWhenItResumes() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, false);
        subscription.cancel();

        subscription.resume(user(8), CARD, true);

        assertThat(subscription.startedWithTrial()).isTrue();
        assertThat(subscription.getTrialUserId()).isEqualTo(8L);
        assertThat(subscription.getNextBillingAt()).isEqualTo(subscription.getTrialEndsAt());
    }

    @Test
    void aGroupCannotGetASecondTrialWhenItResumes() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, true);
        subscription.cancel();

        assertThatThrownBy(() -> subscription.resume(user(8), CARD, true))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void anActiveSubscriptionCannotBeResumed() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, false);

        assertThatThrownBy(() -> subscription.resume(user(8), CARD, false))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void theDtoOfACancelledSubscriptionHasNoBillingNorTrialEnd() {
        PremiumSubscription subscription = PremiumSubscription.start(group(), user(7), CARD, true);
        subscription.cancel();

        PremiumSubscriptionDTO dto = PremiumSubscriptionDTO.from(subscription);

        assertThat(dto.status()).isEqualTo(PremiumSubscriptionStatus.CANCELLED);
        assertThat(dto.nextBillingAt()).isNull();
        assertThat(dto.trialEndsAt()).isNull();
        assertThat(dto.cancelledAt()).isNotNull();
        assertThat(dto.cardLast4()).isEqualTo("4242");
    }
}
