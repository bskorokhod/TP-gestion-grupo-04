package EsNuestro.group;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GroupPremiumSettingsTest {

    private static GroupSettings customSettings() {
        return new GroupSettings(
                DistributionMode.PERCENTAGE,
                VotingModel.OWNERSHIP_WEIGHTED_MAJORITY,
                ReservationLimitPolicy.FIXED_DAYS_PER_MONTH,
                7,
                new BigDecimal("250000")
        );
    }

    @Test
    void defaultSettingsAreNotAPremiumCustomization() {
        GroupSettings defaults = new GroupSettings(
                DistributionMode.EQUAL, VotingModel.SIMPLE_MAJORITY, ReservationLimitPolicy.EQUAL, null,
                new BigDecimal("100000")
        );

        assertTrue(defaults.usesDefaultPremiumSettings());
    }

    @Test
    void changingAnyPremiumSettingIsACustomization() {
        assertFalse(customSettings().usesDefaultPremiumSettings());
        assertFalse(customSettings().withDistributionMode(DistributionMode.EQUAL).usesDefaultPremiumSettings());
    }

    @Test
    void theExtraordinaryThresholdIsNotPartOfThePremiumCustomization() {
        GroupSettings defaults = customSettings().revertedToDefaults();

        assertTrue(defaults.withExtraordinaryExpenseThreshold(new BigDecimal("5")).usesDefaultPremiumSettings());
    }

    @Test
    void endingPremiumRevertsTheSettingsToTheDefaultsAndKeepsTheThreshold() {
        Group group = new Group("Casa", "Gastos de la casa", "ABC-1234-XYZ", customSettings());
        group.activatePremium();

        group.deactivatePremium();

        GroupSettings settings = group.getSettings();
        assertFalse(group.isPremium());
        assertEquals(DistributionMode.EQUAL, settings.getDistributionMode());
        assertEquals(VotingModel.SIMPLE_MAJORITY, settings.getVotingModel());
        assertEquals(ReservationLimitPolicy.EQUAL, settings.getReservationLimitPolicy());
        assertNull(settings.getReservationFixedDaysPerMonth());
        assertEquals(new BigDecimal("250000.00"), settings.getExtraordinaryExpenseThreshold());
    }
}
