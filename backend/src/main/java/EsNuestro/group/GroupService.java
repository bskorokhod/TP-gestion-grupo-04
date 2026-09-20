package EsNuestro.group;

import EsNuestro.common.exception.ItemNotFoundException;
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
class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final JoinCodeGenerator joinCodeGenerator;

    @Autowired
    GroupService(
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            JoinCodeGenerator joinCodeGenerator
    ) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.joinCodeGenerator = joinCodeGenerator;
    }

    GroupDTO createGroup(GroupCreateDTO data, String founderUsername) {
        User founder = requireUser(founderUsername);

        Group group = new Group(data.name(), data.description(), generateUniqueJoinCode());
        groupRepository.save(group);

        String nickname = (data.founderNickname() == null || data.founderNickname().isBlank())
                ? founder.getUsername()
                : data.founderNickname().strip();

        GroupMember founderMembership = GroupMember.founder(
                group, founder, nickname, pickColor(group.getId(), nickname, null)
        );
        groupMemberRepository.save(founderMembership);

        return toGroupDTO(founderMembership);
    }

    List<GroupDTO> listMyGroups(String username) {
        return groupMemberRepository.findByUser_UsernameAndStatus(username, MembershipStatus.ACTIVE).stream()
                .map(this::toGroupDTO)
                .toList();
    }

    GroupDTO getGroup(Long groupId, String callerUsername) throws ItemNotFoundException {
        return toGroupDTO(requireViewer(groupId, callerUsername));
    }

    GroupPreviewDTO previewGroup(String joinCode) throws ItemNotFoundException {
        String normalizedCode = normalizeJoinCode(joinCode);
        return groupRepository.findByJoinCode(normalizedCode)
                .map(GroupPreviewDTO::from)
                .orElseThrow(() -> new ItemNotFoundException("group", normalizedCode));
    }

    JoinRequestDTO requestToJoin(JoinGroupDTO data, String username) throws ItemNotFoundException {
        User user = requireUser(username);
        String normalizedCode = normalizeJoinCode(data.joinCode());
        Group group = groupRepository.findWithLockByJoinCode(normalizedCode)
                .orElseThrow(() -> new ItemNotFoundException("group", normalizedCode));

        String nickname = data.nickname().strip();
        GroupMember membership = groupMemberRepository.findByGroup_IdAndUser_Username(group.getId(), username)
                .map(existing -> requestAgain(existing, nickname))
                .orElseGet(() -> createJoinRequest(group, user, nickname));

        return JoinRequestDTO.from(membership);
    }

    List<JoinRequestDTO> listMyJoinRequests(String username) {
        return groupMemberRepository
                .findByUser_UsernameAndStatusIn(username, EnumSet.of(MembershipStatus.PENDING, MembershipStatus.REJECTED))
                .stream()
                .map(JoinRequestDTO::from)
                .toList();
    }

    List<MemberDTO> listMembers(Long groupId, String callerUsername, MembershipStatus status) throws ItemNotFoundException {
        GroupMember caller = requireViewer(groupId, callerUsername);
        boolean canSeeAll = caller.getRole().isAtLeast(GroupRole.ADMIN);

        return groupMemberRepository.findByGroup_Id(groupId).stream()
                .filter(member -> status == null || member.getStatus() == status)
                .filter(member -> canSeeAll || member.isViewer())
                .map(MemberDTO::from)
                .toList();
    }

    MemberDTO approveJoinRequest(Long groupId, Long memberId, String actingUsername) throws ItemNotFoundException {
        GroupMember target = requirePendingRequestManagedBy(groupId, memberId, actingUsername);
        target.approve();
        return MemberDTO.from(target);
    }

    MemberDTO rejectJoinRequest(Long groupId, Long memberId, String actingUsername) throws ItemNotFoundException {
        GroupMember target = requirePendingRequestManagedBy(groupId, memberId, actingUsername);
        target.reject();
        return MemberDTO.from(target);
    }

    void leaveGroup(Long groupId, String username) throws ItemNotFoundException {
        GroupMember membership = requireActiveMember(groupId, username);
        if (membership.isFounder()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The founder cannot leave the group; transfer ownership or delete the group instead"
            );
        }

        // TODO: cuando existan deudas/gastos, bloquear acá si el miembro tiene deuda pendiente
        membership.deactivateForLeaving();
    }

    void removeMember(Long groupId, Long memberId, String actingUsername) throws ItemNotFoundException {
        GroupMember acting = requireActiveMember(groupId, actingUsername);
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

        // TODO: cuando existan deudas/gastos, bloquear acá si el miembro tiene deuda pendiente.
        target.deactivateForRemoval();
    }

    MemberDTO changeRole(Long groupId, Long memberId, GroupRole newRole, String actingUsername) throws ItemNotFoundException {
        GroupMember acting = requireActiveMember(groupId, actingUsername);
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

    MemberDTO changeNickname(Long groupId, String username, String newNickname) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember membership = requireActiveMember(groupId, username);

        String nickname = newNickname.strip();
        membership.changeIdentity(nickname, pickColor(groupId, nickname, membership));
        return MemberDTO.from(membership);
    }

    List<MemberDTO> updatePercentages(Long groupId, PercentagesUpdateDTO data, String actingUsername) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember acting = requireActiveMember(groupId, actingUsername);
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

    List<MemberDTO> finalizeExits(Long groupId, FinalizeExitsDTO data, String actingUsername) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember acting = requireActiveMember(groupId, actingUsername);
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

    private GroupMember requirePendingRequestManagedBy(Long groupId, Long memberId, String actingUsername) throws ItemNotFoundException {
        GroupMember acting = requireActiveMember(groupId, actingUsername);
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
        return GroupDTO.from(member.getGroup(), member.getRole().isAtLeast(GroupRole.ADMIN));
    }

    private Map<Long, GroupMember> indexById(List<GroupMember> members) {
        return members.stream().collect(Collectors.toMap(GroupMember::getId, Function.identity()));
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private Group requireGroup(Long groupId) throws ItemNotFoundException {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ItemNotFoundException("group", groupId));
    }

    private Group requireGroupForUpdate(Long groupId) throws ItemNotFoundException {
        return groupRepository.findWithLockById(groupId)
                .orElseThrow(() -> new ItemNotFoundException("group", groupId));
    }

    private GroupMember requireMembership(Long groupId, String username) throws ItemNotFoundException {
        requireGroup(groupId);
        return groupMemberRepository.findByGroup_IdAndUser_Username(groupId, username)
                .orElseThrow(() -> new ItemNotFoundException("group member", groupId));
    }

    private GroupMember requireActiveMember(Long groupId, String username) throws ItemNotFoundException {
        GroupMember membership = requireMembership(groupId, username);
        requireStatus(membership, MembershipStatus.ACTIVE);
        return membership;
    }

    private GroupMember requireViewer(Long groupId, String username) throws ItemNotFoundException {
        GroupMember membership = requireMembership(groupId, username);
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

    private void requireAtLeast(GroupMember member, GroupRole minRole) {
        if (!member.getRole().isAtLeast(minRole)) {
            throw new AccessDeniedException("You don't have permission to perform this action");
        }
    }
}