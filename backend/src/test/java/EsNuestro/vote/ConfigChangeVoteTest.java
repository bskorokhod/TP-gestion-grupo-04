package EsNuestro.vote;

import EsNuestro.group.DistributionMode;
import EsNuestro.group.Group;
import EsNuestro.group.GroupSettings;
import EsNuestro.group.ReservationLimitPolicy;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import EsNuestro.member.MemberColor;
import EsNuestro.user.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ConfigChangeVoteTest {

    private final ConfigChangeVoteExecutor executor = new ConfigChangeVoteExecutor();

    private static GroupSettings settings(
            DistributionMode distribution, VotingModel voting, ReservationLimitPolicy reservation, Integer fixedDays
    ) {
        return new GroupSettings(distribution, voting, reservation, fixedDays, new BigDecimal("1000"));
    }

    private static GroupSettings percentageSettings() {
        return settings(
                DistributionMode.PERCENTAGE, VotingModel.OWNERSHIP_WEIGHTED_MAJORITY,
                ReservationLimitPolicy.OWNERSHIP_PROPORTIONAL, null
        );
    }

    private static GroupSettings equalSettings() {
        return settings(DistributionMode.EQUAL, VotingModel.SIMPLE_MAJORITY, ReservationLimitPolicy.EQUAL, null);
    }

    private static Group groupWith(GroupSettings settings) {
        return new Group("Casa", "Casa de la playa", "ABC-1234-XYZ", settings);
    }

    private static GroupMember founderOf(Group group) {
        User user = new User("password", "USER", "Ana", "Perez", "ana@example.com", null, null);
        return GroupMember.founder(group, user, "Ana", MemberColor.RED, BigDecimal.valueOf(100));
    }

    @Test
    void changingTheVotingModelKeepsEverythingElse() {
        GroupSettings current = equalSettings();
        Group group = groupWith(current);
        ConfigChangeVote vote = ConfigChangeVote.ofVotingModel(group, founderOf(group), VotingModel.UNANIMOUS);

        GroupSettings result = vote.applyTo(current);

        assertThat(result.getVotingModel()).isEqualTo(VotingModel.UNANIMOUS);
        assertThat(result.getDistributionMode()).isEqualTo(DistributionMode.EQUAL);
        assertThat(result.getReservationLimitPolicy()).isEqualTo(ReservationLimitPolicy.EQUAL);
        assertThat(result.getExtraordinaryExpenseThreshold()).isEqualByComparingTo("1000");
    }

    @Test
    void changingTheThresholdKeepsEverythingElse() {
        GroupSettings current = equalSettings();
        Group group = groupWith(current);
        ConfigChangeVote vote = ConfigChangeVote.ofExtraordinaryExpenseThreshold(
                group, founderOf(group), new BigDecimal("2500.5")
        );

        GroupSettings result = vote.applyTo(current);

        assertThat(result.getExtraordinaryExpenseThreshold()).isEqualByComparingTo("2500.50");
        assertThat(result.getVotingModel()).isEqualTo(VotingModel.SIMPLE_MAJORITY);
    }

    @Test
    void changingToFixedDaysCarriesTheDaysAndLeavingThemDropsThem() {
        GroupSettings current = equalSettings();
        Group group = groupWith(current);

        GroupSettings fixed = ConfigChangeVote
                .ofReservationLimit(group, founderOf(group), ReservationLimitPolicy.FIXED_DAYS_PER_MONTH, 7)
                .applyTo(current);
        assertThat(fixed.getReservationLimitPolicy()).isEqualTo(ReservationLimitPolicy.FIXED_DAYS_PER_MONTH);
        assertThat(fixed.getReservationFixedDaysPerMonth()).isEqualTo(7);

        GroupSettings back = ConfigChangeVote
                .ofReservationLimit(group, founderOf(group), ReservationLimitPolicy.EQUAL, null)
                .applyTo(fixed);
        assertThat(back.getReservationLimitPolicy()).isEqualTo(ReservationLimitPolicy.EQUAL);
        assertThat(back.getReservationFixedDaysPerMonth()).isNull();
    }

    @Test
    void changingTheFixedDaysWithTheSamePolicyIsAChange() {
        GroupSettings current = settings(
                DistributionMode.EQUAL, VotingModel.SIMPLE_MAJORITY, ReservationLimitPolicy.FIXED_DAYS_PER_MONTH, 7
        );
        Group group = groupWith(current);
        GroupMember proposer = founderOf(group);

        ConfigChangeVote sameDays = ConfigChangeVote
                .ofReservationLimit(group, proposer, ReservationLimitPolicy.FIXED_DAYS_PER_MONTH, 7);
        ConfigChangeVote otherDays = ConfigChangeVote
                .ofReservationLimit(group, proposer, ReservationLimitPolicy.FIXED_DAYS_PER_MONTH, 10);

        assertThat(sameDays.changesNothingIn(current)).isTrue();
        assertThat(otherDays.changesNothingIn(current)).isFalse();
        assertThat(otherDays.applyTo(current).getReservationFixedDaysPerMonth()).isEqualTo(10);
    }

    @Test
    void aProposalEqualToTheCurrentValueChangesNothing() {
        GroupSettings current = equalSettings();
        Group group = groupWith(current);
        GroupMember proposer = founderOf(group);

        assertThat(ConfigChangeVote.ofDistributionMode(group, proposer, DistributionMode.EQUAL)
                .changesNothingIn(current)).isTrue();
        assertThat(ConfigChangeVote.ofVotingModel(group, proposer, VotingModel.SIMPLE_MAJORITY)
                .changesNothingIn(current)).isTrue();
        assertThat(ConfigChangeVote.ofExtraordinaryExpenseThreshold(group, proposer, new BigDecimal("1000.00"))
                .changesNothingIn(current)).isTrue();
        assertThat(ConfigChangeVote.ofExtraordinaryExpenseThreshold(group, proposer, new BigDecimal("1000.01"))
                .changesNothingIn(current)).isFalse();
    }

    @Test
    void movingToEqualDistributionIsRejectedWhileOwnershipOptionsAreInUse() {
        GroupSettings current = percentageSettings();
        Group group = groupWith(current);
        ConfigChangeVote vote = ConfigChangeVote.ofDistributionMode(group, founderOf(group), DistributionMode.EQUAL);

        assertThatThrownBy(() -> vote.applyTo(current)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void ownershipOptionsAreRejectedWhileTheDistributionIsEqual() {
        GroupSettings current = equalSettings();
        Group group = groupWith(current);
        GroupMember proposer = founderOf(group);

        assertThatThrownBy(() -> ConfigChangeVote
                .ofVotingModel(group, proposer, VotingModel.OWNERSHIP_WEIGHTED_MAJORITY).applyTo(current))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ConfigChangeVote
                .ofReservationLimit(group, proposer, ReservationLimitPolicy.OWNERSHIP_PROPORTIONAL, null)
                .applyTo(current))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aConfigChangeVoteIsAlwaysUnanimousAndVisibleToEveryone() {
        Group group = groupWith(equalSettings());
        GroupMember proposer = founderOf(group);
        ConfigChangeVote vote = ConfigChangeVote.ofVotingModel(group, proposer, VotingModel.UNANIMOUS);

        assertThat(vote.getVotingModel()).isEqualTo(VotingModel.UNANIMOUS);
        assertThat(vote.getType()).isEqualTo(VoteType.CONFIG_CHANGE);
        assertThat(vote.getSetting()).isEqualTo(ConfigSetting.VOTING_MODEL);
        assertThat(vote.isVisibleTo(proposer)).isTrue();
    }

    @Test
    void theExecutorAppliesTheApprovedChangeToTheGroup() {
        Group group = groupWith(equalSettings());
        ConfigChangeVote vote = ConfigChangeVote.ofDistributionMode(group, founderOf(group), DistributionMode.PERCENTAGE);

        assertThat(executor.type()).isEqualTo(VoteType.CONFIG_CHANGE);
        assertThat(executor.execute(vote)).isEmpty();
        assertThat(group.getSettings().getDistributionMode()).isEqualTo(DistributionMode.PERCENTAGE);
    }

    @Test
    void theExecutorReportsInsteadOfThrowingWhenTheChangeIsNoLongerCoherent() {
        Group group = groupWith(percentageSettings());
        ConfigChangeVote vote = ConfigChangeVote.ofDistributionMode(group, founderOf(group), DistributionMode.EQUAL);

        assertThat(executor.execute(vote)).isPresent();
        assertThat(group.getSettings().getDistributionMode()).isEqualTo(DistributionMode.PERCENTAGE);
    }
}
