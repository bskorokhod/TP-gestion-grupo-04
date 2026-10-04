package EsNuestro.group;

import EsNuestro.member.GroupMember;
import EsNuestro.member.MemberColor;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GroupOwnershipTest {

    private static GroupSettings percentageSettings() {
        return new GroupSettings(
                DistributionMode.PERCENTAGE, VotingModel.OWNERSHIP_WEIGHTED_MAJORITY,
                ReservationLimitPolicy.OWNERSHIP_PROPORTIONAL, null, new BigDecimal("1000")
        );
    }

    private static GroupSettings equalSettings() {
        return new GroupSettings(
                DistributionMode.EQUAL, VotingModel.SIMPLE_MAJORITY,
                ReservationLimitPolicy.EQUAL, null, new BigDecimal("1000")
        );
    }

    private static Group group(GroupSettings settings) {
        return new Group("Casa", "Casa de la playa", "ABC-1234-XYZ", settings);
    }

    private static GroupMember founder(Group group, String percentage) {
        return GroupMember.founder(group, null, "Fundador", MemberColor.RED, new BigDecimal(percentage));
    }

    private static GroupMember activeMember(Group group, String percentage) {
        GroupMember member = GroupMember.joinRequest(group, null, "Miembro", MemberColor.BLUE, new BigDecimal(percentage));
        member.approve();
        return member;
    }

    private static GroupMember pendingMember(Group group, String percentage) {
        return GroupMember.joinRequest(group, null, "Pendiente", MemberColor.GREEN, new BigDecimal(percentage));
    }

    @Test
    void fourActiveMembersAt25AreRunning() {
        Group group = group(percentageSettings());
        founder(group, "25");
        activeMember(group, "25");
        activeMember(group, "25");
        activeMember(group, "25");

        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
        assertThat(group.assignedPercentage()).isEqualByComparingTo("100");
        assertThat(group.missingPercentage()).isEqualByComparingTo("0");
    }

    @Test
    void threeActiveMembersAt30AreStoppedAndTenIsMissing() {
        Group group = group(percentageSettings());
        founder(group, "30");
        activeMember(group, "30");
        activeMember(group, "30");

        assertThat(group.getStatus()).isEqualTo(GroupStatus.STOPPED);
        assertThat(group.missingPercentage()).isEqualByComparingTo("10");
    }

    @Test
    void loweringOwnPercentageStopsTheGroupAndRaisingItResumesIt() {
        Group group = group(percentageSettings());
        GroupMember first = founder(group, "25");
        activeMember(group, "25");
        activeMember(group, "25");
        activeMember(group, "25");

        first.updatePercentage(new BigDecimal("15"));
        assertThat(group.getStatus()).isEqualTo(GroupStatus.STOPPED);
        assertThat(group.missingPercentage()).isEqualByComparingTo("10");

        first.updatePercentage(new BigDecimal("25"));
        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
    }

    @Test
    void pendingMembersDoNotCount() {
        Group group = group(percentageSettings());
        founder(group, "30");
        activeMember(group, "30");
        activeMember(group, "30");
        pendingMember(group, "10");

        assertThat(group.assignedPercentage()).isEqualByComparingTo("90");
        assertThat(group.getStatus()).isEqualTo(GroupStatus.STOPPED);
    }

    @Test
    void deactivatedMembersDoNotCount() {
        Group group = group(percentageSettings());
        founder(group, "40");
        activeMember(group, "35");
        activeMember(group, "25");
        GroupMember leaving = activeMember(group, "20");
        assertThat(group.assignedPercentage()).isEqualByComparingTo("120");

        leaving.deactivateForLeaving();

        assertThat(group.assignedPercentage()).isEqualByComparingTo("100");
        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
    }

    @Test
    void whenAMemberLeavesTheRestAreStoppedUntilTheyReadjust() {
        Group group = group(percentageSettings());
        founder(group, "25");
        activeMember(group, "25");
        activeMember(group, "25");
        GroupMember leaving = activeMember(group, "25");

        leaving.deactivateForLeaving();
        group.refreshOwnership();

        assertThat(group.getStatus()).isEqualTo(GroupStatus.STOPPED);
        assertThat(group.missingPercentage()).isEqualByComparingTo("25");
    }

    @Test
    void theSoleRemainingMemberGetsAHundredPercent() {
        Group group = group(percentageSettings());
        GroupMember first = founder(group, "60");
        GroupMember second = activeMember(group, "40");

        second.deactivateForLeaving();
        group.refreshOwnership();

        assertThat(first.getPercentage()).isEqualByComparingTo("100");
        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
    }

    @Test
    void aSingleFounderBelowAHundredLeavesTheGroupStopped() {
        Group group = group(percentageSettings());
        founder(group, "40");

        assertThat(group.getStatus()).isEqualTo(GroupStatus.STOPPED);
        assertThat(group.missingPercentage()).isEqualByComparingTo("60");
    }

    @Test
    void equalModeIsRunningWithAtLeastOneActiveMember() {
        Group group = group(equalSettings());
        assertThat(group.getStatus()).isEqualTo(GroupStatus.STOPPED);

        founder(group, "100");
        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
    }

    @Test
    void equalModeSplitsExactlyAHundredAndGivesTheLeftoverToTheOldestMembers() {
        Group group = group(equalSettings());
        GroupMember first = founder(group, "100");
        GroupMember second = activeMember(group, "0");
        GroupMember third = activeMember(group, "0");

        group.refreshOwnership();

        assertThat(group.assignedPercentage()).isEqualByComparingTo("100");
        assertThat(List.of(first, second, third))
                .extracting(GroupMember::getPercentage)
                .containsExactlyInAnyOrder(new BigDecimal("33.34"), new BigDecimal("33.33"), new BigDecimal("33.33"));
    }

    @Test
    void equalModeIgnoresLeavingMembersWhenSplitting() {
        Group group = group(equalSettings());
        GroupMember first = founder(group, "100");
        GroupMember second = activeMember(group, "0");
        GroupMember leaving = activeMember(group, "0");

        leaving.deactivateForLeaving();
        group.refreshOwnership();

        assertThat(first.getPercentage()).isEqualByComparingTo("50");
        assertThat(second.getPercentage()).isEqualByComparingTo("50");
    }

    @Test
    void switchingFromPercentageToEqualRedistributesImmediately() {
        Group group = group(percentageSettings());
        GroupMember first = founder(group, "60");
        GroupMember second = activeMember(group, "40");

        group.changeSettings(equalSettings());

        assertThat(first.getPercentage()).isEqualByComparingTo("50");
        assertThat(second.getPercentage()).isEqualByComparingTo("50");
    }

    @Test
    void switchingFromEqualToPercentageKeepsTheEqualSharesAndTheGroupRunning() {
        Group group = group(equalSettings());
        GroupMember first = founder(group, "100");
        GroupMember second = activeMember(group, "0");
        group.refreshOwnership();

        group.changeSettings(percentageSettings());

        assertThat(first.getPercentage()).isEqualByComparingTo("50");
        assertThat(second.getPercentage()).isEqualByComparingTo("50");
        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
    }
}
