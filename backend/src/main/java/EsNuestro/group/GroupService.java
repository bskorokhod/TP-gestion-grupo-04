package EsNuestro.group;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.expense.DebtRepository;
import EsNuestro.group.dtos.GroupCreateDTO;
import EsNuestro.group.dtos.GroupDTO;
import EsNuestro.group.dtos.GroupPreviewDTO;
import EsNuestro.group.dtos.JoinGroupDTO;
import EsNuestro.member.*;
import EsNuestro.member.dtos.FinalizeExitsDTO;
import EsNuestro.member.dtos.JoinRequestDTO;
import EsNuestro.member.dtos.MemberDTO;
import EsNuestro.member.dtos.PercentagesUpdateDTO;
import EsNuestro.user.User;
import EsNuestro.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final JoinCodeGenerator joinCodeGenerator;
    private final DebtRepository debtRepository;

    @Autowired
    GroupService(
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            JoinCodeGenerator joinCodeGenerator,
            DebtRepository debtRepository
    ) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.joinCodeGenerator = joinCodeGenerator;
        this.debtRepository = debtRepository;
    }

    GroupDTO createGroup(GroupCreateDTO data, String founderEmail) {
        User founder = requireUser(founderEmail);

        Group group = new Group(data.name(), data.description(), generateUniqueJoinCode());
        groupRepository.save(group);

        String nickname = (data.founderNickname() == null || data.founderNickname().isBlank())
                ? resolveDefaultNickname(founder)
                : data.founderNickname().strip();

        GroupMember founderMembership = GroupMember.founder(
                group, founder, nickname, pickColor(group.getId(), nickname, null)
        );
        groupMemberRepository.save(founderMembership);

        return toGroupDTO(founderMembership);
    }

    List<GroupDTO> listMyGroups(String email) {
        return groupMemberRepository.findByUser_EmailAndStatus(email, MembershipStatus.ACTIVE).stream()
                .map(this::toGroupDTO)
                .toList();
    }

    GroupDTO getGroup(Long groupId, String callerEmail) throws ItemNotFoundException {
        return toGroupDTO(requireViewer(groupId, callerEmail));
    }

    /**
     * Resuelve un grupo por su código (el que aparece en las URLs). Un código inexistente y un grupo del
     * que el caller no es miembro devuelven la misma respuesta (404), para no revelar qué códigos existen.
     */
    GroupDTO getGroupByCode(String joinCode, String callerEmail) throws ItemNotFoundException {
        String normalizedCode = normalizeJoinCode(joinCode);
        Group group = groupRepository.findByJoinCode(normalizedCode)
                .orElseThrow(() -> new ItemNotFoundException("group", normalizedCode));
        GroupMember membership = groupMemberRepository.findByGroup_IdAndUser_Email(group.getId(), callerEmail)
                .orElseThrow(() -> new ItemNotFoundException("group", normalizedCode));
        if (!membership.isViewer()) {
            throw new AccessDeniedException("You don't have access to this group");
        }
        return toGroupDTO(membership);
    }

    GroupPreviewDTO previewGroup(String joinCode) throws ItemNotFoundException {
        String normalizedCode = normalizeJoinCode(joinCode);
        return groupRepository.findByJoinCode(normalizedCode)
                .map(GroupPreviewDTO::from)
                .orElseThrow(() -> new ItemNotFoundException("group", normalizedCode));
    }

    JoinRequestDTO requestToJoin(JoinGroupDTO data, String email) throws ItemNotFoundException {
        User user = requireUser(email);
        String normalizedCode = normalizeJoinCode(data.joinCode());
        Group group = groupRepository.findWithLockByJoinCode(normalizedCode)
                .orElseThrow(() -> new ItemNotFoundException("group", normalizedCode));

        String nickname = data.nickname().strip();
        GroupMember membership = groupMemberRepository.findByGroup_IdAndUser_Email(group.getId(), email)
                .map(existing -> requestAgain(existing, nickname))
                .orElseGet(() -> createJoinRequest(group, user, nickname));

        return JoinRequestDTO.from(membership);
    }

    List<JoinRequestDTO> listMyJoinRequests(String email) {
        return groupMemberRepository
                .findByUser_EmailAndStatusIn(email, EnumSet.of(MembershipStatus.PENDING, MembershipStatus.REJECTED))
                .stream()
                .map(JoinRequestDTO::from)
                .toList();
    }

    List<MemberDTO> listMembers(Long groupId, String callerEmail, MembershipStatus status) throws ItemNotFoundException {
        GroupMember caller = requireViewer(groupId, callerEmail);
        boolean canSeeAll = caller.getRole().isAtLeast(GroupRole.ADMIN);

        return groupMemberRepository.findByGroup_Id(groupId).stream()
                .filter(member -> status == null || member.getStatus() == status)
                .filter(member -> canSeeAll || member.isViewer())
                .map(MemberDTO::from)
                .toList();
    }

    MemberDTO approveJoinRequest(Long groupId, Long memberId, String actingEmail) throws ItemNotFoundException {
        GroupMember target = requirePendingRequestManagedBy(groupId, memberId, actingEmail);
        target.approve();
        return MemberDTO.from(target);
    }

    MemberDTO rejectJoinRequest(Long groupId, Long memberId, String actingEmail) throws ItemNotFoundException {
        GroupMember target = requirePendingRequestManagedBy(groupId, memberId, actingEmail);
        target.reject();
        return MemberDTO.from(target);
    }

    void leaveGroup(Long groupId, String email) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember membership = requireActiveMember(groupId, email);
        if (membership.isFounder()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The founder cannot leave the group; transfer ownership or delete the group instead"
            );
        }

        requireNoUnsettledDebts(membership);
        membership.deactivateForLeaving();
    }

    void removeMember(Long groupId, Long memberId, String actingEmail) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember acting = requireActiveMember(groupId, actingEmail);
        requireAtLeast(acting, GroupRole.ADMIN);

        GroupMember target = requireMemberById(groupId, memberId);
        if (target.isFounder()) {
            throw new AccessDeniedException("The founder cannot be removed from the group");
        }
        if (target.getRole() == GroupRole.ADMIN && !acting.isFounder()) {
            throw new AccessDeniedException("Only the founder can remove an admin");
        }
        if (!target.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Member is not active");
        }

        requireNoUnsettledDebts(target);
        target.deactivateForRemoval();
    }

    MemberDTO changeRole(Long groupId, Long memberId, GroupRole newRole, String actingEmail) throws ItemNotFoundException {
        GroupMember acting = requireActiveMember(groupId, actingEmail);
        if (!acting.isFounder()) {
            throw new AccessDeniedException("Only the founder can change member roles");
        }
        if (newRole == GroupRole.FOUNDER) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ownership transfer is not supported through this operation"
            );
        }

        GroupMember target = requireMemberById(groupId, memberId);
        if (target.isFounder()) {
            throw new AccessDeniedException("The founder's role cannot be changed");
        }
        target.changeRole(newRole);
        return MemberDTO.from(target);
    }

    MemberDTO changeNickname(Long groupId, String email, String newNickname) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember membership = requireActiveMember(groupId, email);

        String nickname = newNickname.strip();
        membership.changeIdentity(nickname, pickColor(groupId, nickname, membership));
        return MemberDTO.from(membership);
    }

    List<MemberDTO> updatePercentages(Long groupId, PercentagesUpdateDTO data, String actingEmail) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember acting = requireActiveMember(groupId, actingEmail);
        requireAtLeast(acting, GroupRole.ADMIN);

        List<GroupMember> members = groupMemberRepository.findByGroup_Id(groupId);
        Map<Long, GroupMember> byId = indexById(members);
        Map<Long, BigDecimal> changes = PercentageDistribution.toMap(data.percentages());

        requireChangesTargetActiveMembers(byId, changes);
        PercentageDistribution.requireTotalOfOneHundred(
                members.stream().filter(GroupMember::holdsOwnership).toList(), changes
        );

        changes.forEach((memberId, percentage) -> byId.get(memberId).updatePercentage(percentage));
        return members.stream().map(MemberDTO::from).toList();
    }

    List<MemberDTO> finalizeExits(Long groupId, FinalizeExitsDTO data, String actingEmail) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember acting = requireActiveMember(groupId, actingEmail);
        requireAtLeast(acting, GroupRole.ADMIN);

        List<GroupMember> members = groupMemberRepository.findByGroup_Id(groupId);
        Map<Long, GroupMember> byId = indexById(members);

        List<GroupMember> toFinalize = new ArrayList<>();
        for (Long memberId : new LinkedHashSet<>(data.memberIds())) {
            GroupMember member = byId.get(memberId);
            if (member == null) {
                throw new ItemNotFoundException("group member", memberId);
            }
            requireStatus(member, MembershipStatus.DEACTIVATED);
            toFinalize.add(member);
        }

        Map<Long, BigDecimal> changes = PercentageDistribution.toMap(data.percentages());
        requireChangesTargetActiveMembers(byId, changes);

        Set<Long> finalizingIds = toFinalize.stream().map(GroupMember::getId).collect(Collectors.toSet());
        List<GroupMember> remainingHolders = members.stream()
                .filter(GroupMember::holdsOwnership)
                .filter(member -> !finalizingIds.contains(member.getId()))
                .toList();
        PercentageDistribution.requireTotalOfOneHundred(remainingHolders, changes);

        changes.forEach((memberId, percentage) -> byId.get(memberId).updatePercentage(percentage));
        toFinalize.forEach(GroupMember::finalizeExit);

        return members.stream().map(MemberDTO::from).toList();
    }

    private GroupMember createJoinRequest(Group group, User user, String nickname) {
        GroupMember request = GroupMember.joinRequest(group, user, nickname, pickColor(group.getId(), nickname, null));
        return groupMemberRepository.save(request);
    }

    private GroupMember requestAgain(GroupMember member, String nickname) {
        requireCanRequestAgain(member);
        member.requestAgain(nickname, pickColor(member.getGroup().getId(), nickname, member));
        return member;
    }

    private void requireCanRequestAgain(GroupMember member) {
        if (member.canRequestAgain()) {
            return;
        }
        String reason = member.getStatus() == MembershipStatus.REMOVED
                ? "You were removed from this group and cannot request to join again"
                : "You already belong to this group or have a pending request";
        throw new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }

    private GroupMember requirePendingRequestManagedBy(Long groupId, Long memberId, String actingEmail) throws ItemNotFoundException {
        GroupMember acting = requireActiveMember(groupId, actingEmail);
        requireAtLeast(acting, GroupRole.ADMIN);

        GroupMember target = requireMemberById(groupId, memberId);
        requireStatus(target, MembershipStatus.PENDING);
        return target;
    }

    private void requireChangesTargetActiveMembers(Map<Long, GroupMember> byId, Map<Long, BigDecimal> changes) throws ItemNotFoundException {
        for (Long memberId : changes.keySet()) {
            GroupMember member = byId.get(memberId);
            if (member == null) {
                throw new ItemNotFoundException("group member", memberId);
            }
            requireStatus(member, MembershipStatus.ACTIVE);
        }
    }

    private MemberColor pickColor(Long groupId, String nickname, GroupMember current) {
        Set<MemberColor> takenColors = groupMemberRepository
                .findByGroup_IdAndNicknameIgnoreCaseAndStatusIn(groupId, nickname, MembershipStatus.IDENTITY_OCCUPYING)
                .stream()
                .filter(member -> current == null || !member.getId().equals(current.getId()))
                .map(GroupMember::getColor)
                .collect(Collectors.toSet());

        if (current != null && !takenColors.contains(current.getColor())) {
            return current.getColor();
        }
        return Arrays.stream(MemberColor.values())
                .filter(color -> !takenColors.contains(color))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT, "Nickname is already used by too many members in this group"
                ));
    }

    private String generateUniqueJoinCode() {
        String code;
        do {
            code = joinCodeGenerator.generate();
        } while (groupRepository.existsByJoinCode(code));
        return code;
    }

    private String normalizeJoinCode(String joinCode) {
        return joinCode.strip().toUpperCase(Locale.ROOT);
    }

    private GroupDTO toGroupDTO(GroupMember member) {
        return GroupDTO.from(member.getGroup(), member);
    }

    private Map<Long, GroupMember> indexById(List<GroupMember> members) {
        return members.stream().collect(Collectors.toMap(GroupMember::getId, Function.identity()));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public Group requireGroupForUpdate(Long groupId) throws ItemNotFoundException {
        return groupRepository.findWithLockById(groupId)
                .orElseThrow(() -> new ItemNotFoundException("group", groupId));
    }

    /**
     * Un grupo inexistente y un grupo del que el caller no es miembro producen exactamente la misma
     * respuesta (404 "group"), para no revelar a quien no pertenece qué grupos existen.
     */
    private GroupMember requireMembership(Long groupId, String email) throws ItemNotFoundException {
        return groupMemberRepository.findByGroup_IdAndUser_Email(groupId, email)
                .orElseThrow(() -> new ItemNotFoundException("group", groupId));
    }

    public GroupMember requireActiveMember(Long groupId, String email) throws ItemNotFoundException {
        GroupMember membership = requireMembership(groupId, email);
        requireStatus(membership, MembershipStatus.ACTIVE);
        return membership;
    }

    public GroupMember requireViewer(Long groupId, String email) throws ItemNotFoundException {
        GroupMember membership = requireMembership(groupId, email);
        if (!membership.isViewer()) {
            throw new AccessDeniedException("You don't have access to this group");
        }
        return membership;
    }

    private GroupMember requireMemberById(Long groupId, Long memberId) throws ItemNotFoundException {
        GroupMember member = groupMemberRepository.findById(memberId)
                .orElseThrow(() -> new ItemNotFoundException("group member", memberId));
        if (!member.getGroup().getId().equals(groupId)) {
            throw new ItemNotFoundException("group member", memberId);
        }
        return member;
    }

    private void requireStatus(GroupMember member, MembershipStatus expected) {
        if (member.getStatus() != expected) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Expected membership status " + expected + " but was " + member.getStatus()
            );
        }
    }

    public void requireAtLeast(GroupMember member, GroupRole minRole) {
        if (!member.getRole().isAtLeast(minRole)) {
            throw new AccessDeniedException("You don't have permission to perform this action");
        }
    }

    /**
     * Apodo por defecto cuando el usuario no elige uno: «Nombre Apellido» si cabe en 20
     * caracteres, solo «Nombre» en caso contrario.
     */
    private String resolveDefaultNickname(User user) {
        String fullName = user.getName() + " " + user.getSurname();
        return fullName.length() <= 20 ? fullName : user.getName();
    }

    private void requireNoUnsettledDebts(GroupMember member) {
        if (debtRepository.existsUnsettledByDebtorId(member.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The member has unsettled debts and cannot leave the group yet"
            );
        }
    }
}