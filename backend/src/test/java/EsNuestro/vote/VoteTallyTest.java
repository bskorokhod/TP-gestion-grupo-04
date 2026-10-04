package EsNuestro.vote;

import EsNuestro.group.VotingModel;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static EsNuestro.vote.VoteTally.Result.APPROVED;
import static EsNuestro.vote.VoteTally.Result.OPEN;
import static EsNuestro.vote.VoteTally.Result.REJECTED;
import static org.assertj.core.api.Assertions.assertThat;

class VoteTallyTest {

    private static VoteTally.Entry yes() {
        return new VoteTally.Entry(BigDecimal.ONE, VoteChoice.YES);
    }

    private static VoteTally.Entry no() {
        return new VoteTally.Entry(BigDecimal.ONE, VoteChoice.NO);
    }

    private static VoteTally.Entry pending() {
        return new VoteTally.Entry(BigDecimal.ONE, null);
    }

    private static VoteTally.Entry weighted(String weight, VoteChoice choice) {
        return new VoteTally.Entry(new BigDecimal(weight), choice);
    }

    private static VoteTally.Result simple(VoteTally.Entry... entries) {
        return VoteTally.evaluate(VotingModel.SIMPLE_MAJORITY, List.of(entries));
    }

    private static VoteTally.Result unanimous(VoteTally.Entry... entries) {
        return VoteTally.evaluate(VotingModel.UNANIMOUS, List.of(entries));
    }

    private static VoteTally.Result ownership(VoteTally.Entry... entries) {
        return VoteTally.evaluate(VotingModel.OWNERSHIP_WEIGHTED_MAJORITY, List.of(entries));
    }

    @Test
    void simpleMajorityIsApprovedAsSoonAsMoreThanHalfVotedYes() {
        assertThat(simple(yes(), yes(), yes(), pending())).isEqualTo(APPROVED);
        assertThat(simple(yes(), yes(), pending())).isEqualTo(APPROVED);
    }

    @Test
    void simpleMajorityExactTieIsRejected() {
        assertThat(simple(yes(), yes(), no(), no())).isEqualTo(REJECTED);
    }

    @Test
    void simpleMajorityIsRejectedAsSoonAsHalfVotedNo() {
        assertThat(simple(no(), no(), pending(), pending())).isEqualTo(REJECTED);
        assertThat(simple(no(), no(), pending())).isEqualTo(REJECTED);
    }

    @Test
    void simpleMajorityStaysOpenWhileBothOutcomesAreStillPossible() {
        assertThat(simple(yes(), pending(), pending(), pending())).isEqualTo(OPEN);
        assertThat(simple(yes(), yes(), pending(), pending())).isEqualTo(OPEN);
        assertThat(simple(no(), pending(), pending())).isEqualTo(OPEN);
    }

    @Test
    void singleInvolvedMemberDecidesAlone() {
        assertThat(simple(yes())).isEqualTo(APPROVED);
        assertThat(simple(no())).isEqualTo(REJECTED);
        assertThat(simple(pending())).isEqualTo(OPEN);
    }

    @Test
    void unanimousIsRejectedImmediatelyByASingleNo() {
        assertThat(unanimous(no(), pending(), pending())).isEqualTo(REJECTED);
    }

    @Test
    void unanimousNeedsEveryoneToVoteYes() {
        assertThat(unanimous(yes(), yes(), pending())).isEqualTo(OPEN);
        assertThat(unanimous(yes(), yes(), yes())).isEqualTo(APPROVED);
    }

    @Test
    void weightedMajorityCountsOwnershipPercentages() {
        assertThat(ownership(weighted("60", VoteChoice.YES), weighted("40", null))).isEqualTo(APPROVED);
        assertThat(ownership(weighted("60", VoteChoice.NO), weighted("40", VoteChoice.YES))).isEqualTo(REJECTED);
        assertThat(ownership(weighted("40", VoteChoice.YES), weighted("60", null))).isEqualTo(OPEN);
    }

    @Test
    void weightedMajorityExactTieIsRejected() {
        assertThat(ownership(weighted("50", VoteChoice.YES), weighted("50", VoteChoice.NO))).isEqualTo(REJECTED);
    }

    @Test
    void weightedMajorityIgnoresMembersWithoutOwnership() {
        assertThat(ownership(weighted("100", VoteChoice.YES), weighted("0", VoteChoice.NO), weighted("0", null)))
                .isEqualTo(APPROVED);
    }

    @Test
    void weightedMajorityWithNoOwnershipAtAllCountsOneVotePerMember() {
        assertThat(ownership(weighted("0", VoteChoice.YES), weighted("0", VoteChoice.YES), weighted("0", null)))
                .isEqualTo(APPROVED);
        assertThat(ownership(weighted("0", VoteChoice.NO), weighted("0", VoteChoice.NO), weighted("0", null)))
                .isEqualTo(REJECTED);
    }

    @Test
    void voteWithoutEligibleMembersIsRejected() {
        assertThat(simple()).isEqualTo(REJECTED);
        assertThat(unanimous()).isEqualTo(REJECTED);
    }
}
