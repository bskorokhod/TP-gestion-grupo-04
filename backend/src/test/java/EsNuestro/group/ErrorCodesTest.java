package EsNuestro.group;

import EsNuestro.common.exception.ErrorCode;
import EsNuestro.config.GlobalControllerExceptionHandler;
import EsNuestro.expense.DebtRepository;
import EsNuestro.member.GroupMember;
import EsNuestro.member.GroupMemberRepository;
import EsNuestro.member.MemberColor;
import EsNuestro.member.dtos.JoinRequestDTO;
import EsNuestro.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** El cuerpo de error trae el {@code code} estable de cada error de negocio conocido, sin revelar datos del grupo. */
class ErrorCodesTest {

    private GroupRepository groupRepository;
    private GroupMemberRepository memberRepository;
    private UserRepository userRepository;
    private DebtRepository debtRepository;
    private GroupService service;
    private Group group;
    private final GlobalControllerExceptionHandler handler = new GlobalControllerExceptionHandler();

    @BeforeEach
    void setUp() {
        groupRepository = mock(GroupRepository.class);
        memberRepository = mock(GroupMemberRepository.class);
        userRepository = mock(UserRepository.class);
        debtRepository = mock(DebtRepository.class);
        service = new GroupService(groupRepository, memberRepository, userRepository, mock(JoinCodeGenerator.class),
                debtRepository, mock(ApplicationEventPublisher.class));
        group = new Group("Secreto", "Desc", "ABC-1234-XYZ", new GroupSettings(
                DistributionMode.PERCENTAGE, VotingModel.SIMPLE_MAJORITY, ReservationLimitPolicy.EQUAL, null, new BigDecimal("1000")));
        ReflectionTestUtils.setField(group, "id", 1L);
        when(groupRepository.findWithLockByJoinCode("ABC-1234-XYZ")).thenReturn(Optional.of(group));
        when(groupRepository.findWithLockById(1L)).thenReturn(Optional.of(group));
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(mock(EsNuestro.user.User.class)));
        when(memberRepository.findByGroup_IdAndStatusIn(any(), any())).thenReturn(List.of());
    }

    private GroupMember member(long id, String email, String percentage) {
        GroupMember member = GroupMember.joinRequest(group, null, email, MemberColor.BLUE, new BigDecimal(percentage));
        member.approve();
        ReflectionTestUtils.setField(member, "id", id);
        when(memberRepository.findByGroup_IdAndUser_Email(1L, email)).thenReturn(Optional.of(member));
        return member;
    }

    private java.util.Map<String, Object> bodyOf(ResponseStatusException e) {
        ResponseEntity<?> response = handler.handleResponseStatusException(e);
        assertThat(response.getStatusCode()).isEqualTo(e.getStatusCode());
        return (java.util.Map<String, Object>) response.getBody();
    }

    private ResponseStatusException join(String email, String pct) {
        return catchThrowableOfType(ResponseStatusException.class, () -> service.requestToJoin(
                new EsNuestro.group.dtos.JoinGroupDTO("ABC-1234-XYZ", "Nick", null, pct == null ? null : new BigDecimal(pct)), email));
    }

    @Test
    void anActiveMemberJoiningAgainGetsAlreadyMemberOrPending() {
        member(1, "a@x", "100");

        var body = bodyOf(join("a@x", "10"));

        assertThat(body).containsEntry("code", "ALREADY_MEMBER_OR_PENDING");
        assertThat(body).containsKey("message");
    }

    @Test
    void aPercentageThatDoesNotFitGetsNotAvailableWithoutRevealingTheAvailableOne() {
        member(1, "a@x", "70");

        ResponseStatusException e = join("new@x", "50");
        var body = bodyOf(e);

        assertThat(e.getStatusCode().value()).isEqualTo(409);
        assertThat(body).containsEntry("code", "JOIN_PERCENTAGE_NOT_AVAILABLE");
        assertThat((String) body.get("message")).doesNotContain("30").doesNotContain("70").doesNotContain("Secreto");
        assertThat(body.keySet()).containsExactlyInAnyOrder("success", "message", "code");
    }

    @Test
    void invalidPercentagesGetNotAvailableAndAMissingOneGetsRequired() {
        member(1, "a@x", "70");

        assertThat(bodyOf(join("new@x", "0"))).containsEntry("code", "JOIN_PERCENTAGE_NOT_AVAILABLE");
        assertThat(bodyOf(join("new@x", "101"))).containsEntry("code", "JOIN_PERCENTAGE_NOT_AVAILABLE");
        assertThat(bodyOf(join("new@x", "-1"))).containsEntry("code", "JOIN_PERCENTAGE_NOT_AVAILABLE");
        assertThat(bodyOf(join("new@x", "10.123"))).containsEntry("code", "JOIN_PERCENTAGE_NOT_AVAILABLE");
        ResponseStatusException missing = join("new@x", null);
        assertThat(missing.getStatusCode().value()).isEqualTo(400);
        assertThat(bodyOf(missing)).containsEntry("code", "JOIN_PERCENTAGE_REQUIRED");
    }

    @Test
    void approvingARequestThatNoLongerFitsOrIsNotPendingGetsCodes() {
        GroupMember approver = member(1, "a@x", "70");
        GroupMember pending = GroupMember.joinRequest(group, null, "P", MemberColor.RED, new BigDecimal("50"));
        ReflectionTestUtils.setField(pending, "id", 5L);
        when(memberRepository.findById(5L)).thenReturn(Optional.of(pending));

        var noRoom = catchThrowableOfType(ResponseStatusException.class, () -> service.approveJoinRequest(1L, 5L, "a@x"));
        assertThat(bodyOf(noRoom)).containsEntry("code", "JOIN_PERCENTAGE_NOT_AVAILABLE");

        pending.reject();
        var notPending = catchThrowableOfType(ResponseStatusException.class, () -> service.rejectJoinRequest(1L, 5L, "a@x"));
        assertThat(bodyOf(notPending)).containsEntry("code", "JOIN_REQUEST_NOT_PENDING");

        GroupMember noPercentage = GroupMember.joinRequest(group, null, "Q", MemberColor.RED, null);
        ReflectionTestUtils.setField(noPercentage, "id", 6L);
        when(memberRepository.findById(6L)).thenReturn(Optional.of(noPercentage));
        var missing = catchThrowableOfType(ResponseStatusException.class, () -> service.approveJoinRequest(1L, 6L, "a@x"));
        assertThat(bodyOf(missing)).containsEntry("code", "JOIN_PERCENTAGE_REQUIRED");
        assertThat(approver.isActive()).isTrue();
    }

    @Test
    void aCallerWhoIsNotActiveGetsNotActiveMember() {
        GroupMember gone = member(1, "a@x", "100");
        gone.leave();
        member(2, "b@x", "100");

        var e = catchThrowableOfType(ResponseStatusException.class, () -> service.approveJoinRequest(1L, 5L, "a@x"));

        assertThat(bodyOf(e)).containsEntry("code", "NOT_ACTIVE_MEMBER");
    }

    @Test
    void leavingWithDebtsGetsDebtsUnsettled() {
        member(1, "a@x", "100");
        when(debtRepository.existsUnsettledByDebtorId(1L)).thenReturn(true);

        var e = catchThrowableOfType(ResponseStatusException.class, () -> service.leaveGroup(1L, "a@x"));

        assertThat(bodyOf(e)).containsEntry("code", "DEBTS_UNSETTLED");
    }

    @Test
    void aStoppedGroupGetsGroupStopped() {
        member(1, "a@x", "60");

        var e = catchThrowableOfType(ResponseStatusException.class, () -> service.requireRunning(group));

        assertThat(e.getStatusCode().value()).isEqualTo(409);
        assertThat(bodyOf(e)).containsEntry("code", "GROUP_STOPPED");
    }

    @Test
    void errorsWithoutACodeKeepTheOldBody() {
        var body = bodyOf(new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "x"));

        assertThat(body).doesNotContainKey("code");
        assertThat(ErrorCode.values()).extracting(Enum::name).allMatch(n -> n.equals(n.toUpperCase()));
    }
}
