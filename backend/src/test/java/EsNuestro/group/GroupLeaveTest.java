package EsNuestro.group;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.expense.Debt;
import EsNuestro.expense.DebtRepository;
import EsNuestro.group.dtos.LeavePreviewDTO;
import EsNuestro.member.GroupMember;
import EsNuestro.member.GroupMemberRepository;
import EsNuestro.member.MemberColor;
import EsNuestro.member.MembershipStatus;
import EsNuestro.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GroupLeaveTest {

    private static final Long GROUP_ID = 1L;

    private GroupRepository groupRepository;
    private GroupMemberRepository memberRepository;
    private DebtRepository debtRepository;
    private ApplicationEventPublisher events;
    private GroupService service;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        groupRepository = mock(GroupRepository.class);
        memberRepository = mock(GroupMemberRepository.class);
        debtRepository = mock(DebtRepository.class);
        events = mock(ApplicationEventPublisher.class);
        userRepository = mock(UserRepository.class);
        service = new GroupService(groupRepository, memberRepository, userRepository,
                mock(JoinCodeGenerator.class), debtRepository, events);
    }

    private static GroupSettings settings(DistributionMode mode) {
        boolean percentage = mode == DistributionMode.PERCENTAGE;
        return new GroupSettings(
                mode,
                percentage ? VotingModel.OWNERSHIP_WEIGHTED_MAJORITY : VotingModel.SIMPLE_MAJORITY,
                percentage ? ReservationLimitPolicy.OWNERSHIP_PROPORTIONAL : ReservationLimitPolicy.EQUAL,
                null, new BigDecimal("1000"), 10
        );
    }

    private Group group(DistributionMode mode) {
        Group group = new Group("Casa", "Casa", "ABC-1234-XYZ", settings(mode));
        ReflectionTestUtils.setField(group, "id", GROUP_ID);
        when(groupRepository.findWithLockById(GROUP_ID)).thenReturn(Optional.of(group));
        return group;
    }

    private GroupMember member(Group group, long id, String nickname, String percentage) {
        GroupMember member = GroupMember.joinRequest(group, null, nickname, MemberColor.BLUE, new BigDecimal(percentage));
        member.approve();
        ReflectionTestUtils.setField(member, "id", id);
        when(memberRepository.findByGroup_IdAndUser_Email(GROUP_ID, nickname + "@mail.com")).thenReturn(Optional.of(member));
        return member;
    }

    private static Debt debt(GroupMember debtor, GroupMember creditor, String amount, String paid) {
        Debt debt = mock(Debt.class);
        when(debt.getDebtor()).thenReturn(debtor);
        when(debt.getCreditor()).thenReturn(creditor);
        when(debt.remaining()).thenReturn(new BigDecimal(amount).subtract(new BigDecimal(paid)));
        return debt;
    }

    // R2
    @Test
    void aMemberWhoOwesMoneyCannotLeave() {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "50");
        member(group, 2, "B", "50");
        when(debtRepository.existsUnsettledByDebtorId(1L)).thenReturn(true);

        assertThatThrownBy(() -> service.leaveGroup(GROUP_ID, "A@mail.com")).isInstanceOf(ResponseStatusException.class);
        assertThat(a.getStatus()).isEqualTo(MembershipStatus.ACTIVE);
        verify(events, never()).publishEvent(any(Object.class));
    }

    @Test
    void aMemberWhoOnlyHasSettledDebtsCanLeave() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "50");
        member(group, 2, "B", "50");
        when(debtRepository.existsUnsettledByDebtorId(1L)).thenReturn(false);

        service.leaveGroup(GROUP_ID, "A@mail.com");

        assertThat(a.getStatus()).isEqualTo(MembershipStatus.DEACTIVATED);
    }

    // R5
    @Test
    void leavingCancelsOnlyTheDebtsOwedToTheLeavingMember() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "50");
        GroupMember b = member(group, 2, "B", "50");
        Debt owedToB = debt(a, b, "500.00", "0.00");
        Debt owedToA = debt(b, a, "100.00", "0.00");
        when(debtRepository.findCollectableByGroupId(GROUP_ID)).thenReturn(List.of(owedToB, owedToA));

        service.leaveGroup(GROUP_ID, "B@mail.com");

        verify(owedToB).cancel();
        verify(owedToA, never()).cancel();
        verify(events).publishEvent(any(Object.class));
    }

    @Test
    void leavingCancelsEveryCollectableDebtTheRepositoryReturnsForTheLeaver() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "50");
        GroupMember b = member(group, 2, "B", "50");
        Debt active = debt(a, b, "100.00", "0.00");
        Debt suspended = debt(a, b, "50.00", "20.00");
        when(debtRepository.findCollectableByGroupId(GROUP_ID)).thenReturn(List.of(active, suspended));

        service.leaveGroup(GROUP_ID, "B@mail.com");

        verify(active).cancel();
        verify(suspended).cancel();
    }

    @Test
    void leavingLeavesTheMemberDeactivatedWithoutPercentageNorAccess() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        member(group, 1, "A", "60");
        GroupMember b = member(group, 2, "B", "40");

        service.leaveGroup(GROUP_ID, "B@mail.com");

        assertThat(b.getStatus()).isEqualTo(MembershipStatus.DEACTIVATED);
        assertThat(b.getPercentage()).isNull();
        assertThat(b.isActive()).isFalse();
        assertThat(b.isViewer()).isFalse();
        assertThat(b.canRequestAgain()).isTrue();
        assertThatThrownBy(() -> service.requireViewer(GROUP_ID, "B@mail.com"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(() -> service.requireActiveMember(GROUP_ID, "B@mail.com"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void theNicknameOfAMemberWhoLeftIsFreeToReuse() {
        assertThat(MembershipStatus.IDENTITY_OCCUPYING)
                .containsExactlyInAnyOrder(MembershipStatus.PENDING, MembershipStatus.ACTIVE);
    }

    @Test
    void aMemberWhoLeftComesBackReusingTheirRowAsPendingWithTheNewRequest() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "50");
        GroupMember b = member(group, 2, "B", "30");
        member(group, 3, "C", "20");
        service.leaveGroup(GROUP_ID, "B@mail.com");
        assertThat(b.getPercentage()).isNull();

        when(userRepository.findByEmail("B@mail.com")).thenReturn(Optional.of(mock(EsNuestro.user.User.class)));
        when(groupRepository.findWithLockByJoinCode("ABC-1234-XYZ")).thenReturn(Optional.of(group));
        when(memberRepository.findByGroup_IdAndStatusIn(any(), any())).thenReturn(List.of(a));

        var request = service.requestToJoin(
                new EsNuestro.group.dtos.JoinGroupDTO("ABC-1234-XYZ", "Otro", null, new BigDecimal("30")), "B@mail.com");

        assertThat(request.memberId()).isEqualTo(2L);
        assertThat(request.status()).isEqualTo(MembershipStatus.PENDING);
        assertThat(b.getStatus()).isEqualTo(MembershipStatus.PENDING);
        assertThat(b.getNickname()).isEqualTo("Otro");
        assertThat(b.getPercentage()).isEqualByComparingTo("30");
        assertThat(b.getJoinedAt()).isNull();
        verify(memberRepository, never()).save(any(GroupMember.class));
    }

    @Test
    void aRejectedMemberStillReusesTheirRowWhenAskingAgain() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "70");
        GroupMember rejected = member(group, 2, "B", "30");
        rejected.reject();

        when(userRepository.findByEmail("B@mail.com")).thenReturn(Optional.of(mock(EsNuestro.user.User.class)));
        when(groupRepository.findWithLockByJoinCode("ABC-1234-XYZ")).thenReturn(Optional.of(group));
        when(memberRepository.findByGroup_IdAndStatusIn(any(), any())).thenReturn(List.of(a));

        var request = service.requestToJoin(
                new EsNuestro.group.dtos.JoinGroupDTO("ABC-1234-XYZ", "B", null, new BigDecimal("30")), "B@mail.com");

        assertThat(request.memberId()).isEqualTo(2L);
        assertThat(rejected.getStatus()).isEqualTo(MembershipStatus.PENDING);
        verify(memberRepository, never()).save(any(GroupMember.class));
    }

    @Test
    void aMemberWhoIsActiveOrPendingCannotAskToJoinAgain() {
        Group group = group(DistributionMode.EQUAL);
        member(group, 1, "A", "100");
        when(userRepository.findByEmail("A@mail.com")).thenReturn(Optional.of(mock(EsNuestro.user.User.class)));
        when(groupRepository.findWithLockByJoinCode("ABC-1234-XYZ")).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> service.requestToJoin(
                new EsNuestro.group.dtos.JoinGroupDTO("ABC-1234-XYZ", "A", null, null), "A@mail.com"))
                .isInstanceOf(ResponseStatusException.class);
    }

    // R7
    @Test
    void leavingAPercentageGroupThatNoLongerAddsUpTo100StopsIt() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        member(group, 1, "A", "50");
        member(group, 2, "B", "30");
        member(group, 3, "C", "20");

        service.leaveGroup(GROUP_ID, "B@mail.com");

        assertThat(group.getStatus()).isEqualTo(GroupStatus.STOPPED);
        assertThat(group.missingPercentage()).isEqualByComparingTo("30");
    }

    @Test
    void theSoleRemainingMemberOfAPercentageGroupGets100AndTheGroupRuns() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "60");
        member(group, 2, "B", "40");

        service.leaveGroup(GROUP_ID, "B@mail.com");

        assertThat(a.getPercentage()).isEqualByComparingTo("100");
        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
    }

    // R8
    @Test
    void leavingAnEqualGroupRedistributesAndKeepsItRunning() throws ItemNotFoundException {
        Group group = group(DistributionMode.EQUAL);
        GroupMember a = member(group, 1, "A", "33.33");
        GroupMember b = member(group, 2, "B", "33.33");
        member(group, 3, "C", "33.34");

        service.leaveGroup(GROUP_ID, "C@mail.com");

        assertThat(a.getPercentage()).isEqualByComparingTo("50");
        assertThat(b.getPercentage()).isEqualByComparingTo("50");
        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
    }

    @Test
    void theLastActiveMemberLeavingStopsTheGroup() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        member(group, 1, "A", "100");

        service.leaveGroup(GROUP_ID, "A@mail.com");

        assertThat(group.getStatus()).isEqualTo(GroupStatus.STOPPED);
    }

    // R3 y R9
    @Test
    void thePreviewListsWhatIsOwedPerDebtorWithTheRemainingAmount() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "40");
        GroupMember b = member(group, 2, "B", "30");
        GroupMember c = member(group, 3, "C", "30");
        List<Debt> debts = List.of(
                debt(a, b, "500.00", "200.00"),
                debt(a, b, "50.00", "0.00"),
                debt(c, b, "200.00", "0.00"),
                debt(b, c, "999.00", "0.00")
        );
        when(debtRepository.findCollectableByGroupId(GROUP_ID)).thenReturn(debts);

        LeavePreviewDTO preview = service.leavePreview(GROUP_ID, "B@mail.com");

        assertThat(preview.hasUnsettledDebts()).isFalse();
        assertThat(preview.owedToMeTotal()).isEqualByComparingTo("550.00");
        assertThat(preview.owedToMe()).hasSize(2);
        assertThat(preview.owedToMe().get(0).debtorMemberId()).isEqualTo(1L);
        assertThat(preview.owedToMe().get(0).debtorNickname()).isEqualTo("A");
        assertThat(preview.owedToMe().get(0).amount()).isEqualByComparingTo("350.00");
        assertThat(preview.owedToMe().get(1).amount()).isEqualByComparingTo("200.00");
    }

    @Test
    void thePreviewDoesNotCancelAnythingNorRemoveTheMember() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "50");
        GroupMember b = member(group, 2, "B", "50");
        Debt owedToB = debt(a, b, "500.00", "0.00");
        when(debtRepository.findCollectableByGroupId(GROUP_ID)).thenReturn(List.of(owedToB));

        service.leavePreview(GROUP_ID, "B@mail.com");

        verify(owedToB, never()).cancel();
        assertThat(b.getStatus()).isEqualTo(MembershipStatus.ACTIVE);
    }

    // Preview del estado del grupo: misma lógica que el leave real, sin persistir
    @Test
    void thePreviewPredictsAStoppedPercentageGroupAndTheMissingPercentage() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "50");
        GroupMember b = member(group, 2, "B", "30");
        member(group, 3, "C", "20");

        LeavePreviewDTO preview = service.leavePreview(GROUP_ID, "B@mail.com");

        assertThat(preview.groupWillStop()).isTrue();
        assertThat(preview.missingPercentage()).isEqualByComparingTo("30");
        assertThat(b.getStatus()).isEqualTo(MembershipStatus.ACTIVE);
        assertThat(a.getPercentage()).isEqualByComparingTo("50");
        assertThat(group.getStatus()).isEqualTo(GroupStatus.RUNNING);
    }

    @Test
    void thePreviewDoesNotStopThePercentageGroupWhenASingleMemberRemains() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember a = member(group, 1, "A", "60");
        member(group, 2, "B", "40");

        LeavePreviewDTO preview = service.leavePreview(GROUP_ID, "B@mail.com");

        assertThat(preview.groupWillStop()).isFalse();
        assertThat(preview.missingPercentage()).isEqualByComparingTo("0");
        assertThat(a.getPercentage()).isEqualByComparingTo("60");
    }

    @Test
    void thePreviewDoesNotStopAnEqualGroup() throws ItemNotFoundException {
        Group group = group(DistributionMode.EQUAL);
        member(group, 1, "A", "33.33");
        member(group, 2, "B", "33.33");
        member(group, 3, "C", "33.34");

        LeavePreviewDTO preview = service.leavePreview(GROUP_ID, "C@mail.com");

        assertThat(preview.groupWillStop()).isFalse();
        assertThat(preview.missingPercentage()).isEqualByComparingTo("0");
    }

    @Test
    void thePreviewForTheLastMemberStopsTheGroup() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        member(group, 1, "A", "100");

        assertThat(service.leavePreview(GROUP_ID, "A@mail.com").groupWillStop()).isTrue();
    }

    @Test
    void thePreviewMatchesWhatTheRealLeaveDoes() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        member(group, 1, "A", "50");
        member(group, 2, "B", "30");
        member(group, 3, "C", "20");

        LeavePreviewDTO preview = service.leavePreview(GROUP_ID, "B@mail.com");
        service.leaveGroup(GROUP_ID, "B@mail.com");

        assertThat(group.getStatus() == GroupStatus.STOPPED).isEqualTo(preview.groupWillStop());
        assertThat(group.missingPercentage()).isEqualByComparingTo(preview.missingPercentage());
    }

    @Test
    void thePreviewFlagsAMemberWhoOwesMoney() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        member(group, 1, "A", "50");
        member(group, 2, "B", "50");
        when(debtRepository.existsUnsettledByDebtorId(1L)).thenReturn(true);

        LeavePreviewDTO preview = service.leavePreview(GROUP_ID, "A@mail.com");

        assertThat(preview.hasUnsettledDebts()).isTrue();
        assertThat(preview.owedToMe()).isEmpty();
        assertThat(preview.owedToMeTotal()).isEqualByComparingTo("0");
    }

    @Test
    void theFounderLeavesLikeAnyoneElse() throws ItemNotFoundException {
        Group group = group(DistributionMode.PERCENTAGE);
        GroupMember founder = GroupMember.founder(group, null, "F", MemberColor.RED, new BigDecimal("50"));
        ReflectionTestUtils.setField(founder, "id", 9L);
        when(memberRepository.findByGroup_IdAndUser_Email(GROUP_ID, "F@mail.com")).thenReturn(Optional.of(founder));
        member(group, 2, "B", "50");

        service.leaveGroup(GROUP_ID, "F@mail.com");

        assertThat(founder.getStatus()).isEqualTo(MembershipStatus.DEACTIVATED);
    }
}
