package EsNuestro.group;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GroupPremiumTest {

    private static Group group() {
        return new Group("Casa", "Casa de la playa", "ABC-1234-XYZ", null);
    }

    @Test
    void aNewGroupIsNotPremium() {
        assertThat(group().isPremium()).isFalse();
    }

    @Test
    void activatingPremiumMakesTheGroupPremium() {
        Group group = group();

        group.activatePremium();

        assertThat(group.isPremium()).isTrue();
    }

    @Test
    void aPremiumGroupCannotBeActivatedAgain() {
        Group group = group();
        group.activatePremium();

        assertThatThrownBy(group::activatePremium).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void deactivatingPremiumMakesTheGroupNotPremium() {
        Group group = group();
        group.activatePremium();

        group.deactivatePremium();

        assertThat(group.isPremium()).isFalse();
    }

    @Test
    void aNonPremiumGroupCannotBeDeactivated() {
        assertThatThrownBy(() -> group().deactivatePremium()).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void aCancelledGroupCanBeActivatedAgain() {
        Group group = group();
        group.activatePremium();
        group.deactivatePremium();

        group.activatePremium();

        assertThat(group.isPremium()).isTrue();
    }
}
