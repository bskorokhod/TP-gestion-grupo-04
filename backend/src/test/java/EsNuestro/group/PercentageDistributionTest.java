package EsNuestro.group;

import EsNuestro.member.GroupMember;
import EsNuestro.member.MemberColor;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

class PercentageDistributionTest {

    private static final String JOIN_BLOCKED = "You can't join with that percentage. Contact a group member";

    private static GroupSettings percentageSettings() {
        return new GroupSettings(
                DistributionMode.PERCENTAGE, VotingModel.OWNERSHIP_WEIGHTED_MAJORITY,
                ReservationLimitPolicy.OWNERSHIP_PROPORTIONAL, null, new BigDecimal("1000")
        );
    }

    private static Group groupWithActive(String... percentages) {
        Group group = new Group("Casa", "Casa de la playa", "ABC-1234-XYZ", percentageSettings());
        for (String percentage : percentages) {
            GroupMember member = GroupMember.joinRequest(
                    group, null, "Miembro", MemberColor.BLUE, new BigDecimal(percentage)
            );
            member.approve();
        }
        return group;
    }

    private static void assertRejectedWith(Runnable action, String message) {
        assertThatThrownBy(action::run)
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getReason())
                .isEqualTo(message);
    }

    @Test
    void negativePercentagesAreRejected() {
        assertRejectedWith(
                () -> PercentageDistribution.requireValidPercentage(new BigDecimal("-5")),
                "Negative percentages cannot be assigned"
        );
    }

    @Test
    void zeroIsRejectedAsNull() {
        assertRejectedWith(
                () -> PercentageDistribution.requireValidPercentage(BigDecimal.ZERO),
                "Zero percentages cannot be assigned"
        );
        assertRejectedWith(
                () -> PercentageDistribution.requireValidPercentage(new BigDecimal("0.00")),
                "Zero percentages cannot be assigned"
        );
    }

    @Test
    void percentagesAboveAHundredAreRejected() {
        assertRejectedWith(
                () -> PercentageDistribution.requireValidPercentage(new BigDecimal("120")),
                "Percentages greater than 100% cannot be assigned"
        );
        assertRejectedWith(
                () -> PercentageDistribution.requireValidPercentage(new BigDecimal("100.01")),
                "Percentages greater than 100% cannot be assigned"
        );
    }

    @Test
    void aMissingPercentageIsRejected() {
        assertRejectedWith(() -> PercentageDistribution.requireValidPercentage(null), "The percentage is required");
    }

    @Test
    void moreThanTwoDecimalsAreRejectedInsteadOfRoundedToZero() {
        assertRejectedWith(
                () -> PercentageDistribution.requireValidPercentage(new BigDecimal("0.001")),
                "The percentage allows up to two decimal places"
        );
        assertRejectedWith(
                () -> PercentageDistribution.requireValidPercentage(new BigDecimal("33.333")),
                "The percentage allows up to two decimal places"
        );
    }

    @Test
    void validPercentagesAreNormalizedToTwoDecimals() {
        assertThat(PercentageDistribution.requireValidPercentage(new BigDecimal("0.5"))).isEqualTo(new BigDecimal("0.50"));
        assertThat(PercentageDistribution.requireValidPercentage(new BigDecimal("0.01"))).isEqualTo(new BigDecimal("0.01"));
        assertThat(PercentageDistribution.requireValidPercentage(new BigDecimal("1"))).isEqualTo(new BigDecimal("1.00"));
        assertThat(PercentageDistribution.requireValidPercentage(new BigDecimal("100"))).isEqualTo(new BigDecimal("100.00"));
        assertThat(PercentageDistribution.requireValidPercentage(new BigDecimal("33.30"))).isEqualTo(new BigDecimal("33.30"));
    }

    @Test
    void raisingAMemberAboveTheTotalReportsTheExcess() {
        Group group = groupWithActive("40", "35", "25");
        GroupMember last = group.activeMembers().get(2);

        assertRejectedWith(
                () -> PercentageDistribution.requireWithinTotalAfterChange(
                        group.activeMembers(), last, new BigDecimal("30.00")
                ),
                "You exceeded the limit by 5%"
        );
    }

    @Test
    void theExcessKeepsItsDecimals() {
        Group group = groupWithActive("40", "35", "25");
        GroupMember last = group.activeMembers().get(2);

        assertRejectedWith(
                () -> PercentageDistribution.requireWithinTotalAfterChange(
                        group.activeMembers(), last, new BigDecimal("25.50")
                ),
                "You exceeded the limit by 0.5%"
        );
    }

    @Test
    void changesThatKeepTheSumAtOrBelowAHundredAreAccepted() {
        Group group = groupWithActive("40", "35", "25");
        GroupMember first = group.activeMembers().getFirst();

        assertThatCode(() -> PercentageDistribution.requireWithinTotalAfterChange(
                group.activeMembers(), first, new BigDecimal("30.00")
        )).doesNotThrowAnyException();
        assertThatCode(() -> PercentageDistribution.requireWithinTotalAfterChange(
                group.activeMembers(), first, new BigDecimal("40.00")
        )).doesNotThrowAnyException();
    }

    @Test
    void aJoinRequestThatExceedsAHundredIsBlockedWithTheGenericMessage() {
        Group stopped = groupWithActive("40", "30");

        assertRejectedWith(
                () -> PercentageDistribution.requireRoomToJoin(stopped, new BigDecimal("40.00")), JOIN_BLOCKED
        );
    }

    @Test
    void aJoinRequestThatFitsIsAcceptedEvenIfTheGroupStaysStopped() {
        Group stopped = groupWithActive("40", "30");

        assertThatCode(() -> PercentageDistribution.requireRoomToJoin(stopped, new BigDecimal("20.00")))
                .doesNotThrowAnyException();
    }

    @Test
    void aJoinRequestThatCompletesExactlyAHundredIsAccepted() {
        Group stopped = groupWithActive("40", "50");

        assertThatCode(() -> PercentageDistribution.requireRoomToJoin(stopped, new BigDecimal("10.00")))
                .doesNotThrowAnyException();
    }

    @Test
    void aJoinRequestToARunningGroupGetsTheSameMessageAsToAStoppedOne() {
        Group running = groupWithActive("40", "35", "25");

        assertRejectedWith(
                () -> PercentageDistribution.requireRoomToJoin(running, new BigDecimal("10.00")), JOIN_BLOCKED
        );
    }

    @Test
    void aSinglePercentIsTheSmallestShareThatFitsInTheLastGap() {
        Group almostFull = groupWithActive("40", "59.99");

        assertThatCode(() -> PercentageDistribution.requireRoomToJoin(almostFull, new BigDecimal("0.01")))
                .doesNotThrowAnyException();
        assertRejectedWith(
                () -> PercentageDistribution.requireRoomToJoin(almostFull, new BigDecimal("0.02")), JOIN_BLOCKED
        );
    }
}
