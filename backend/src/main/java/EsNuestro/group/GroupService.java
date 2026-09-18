package EsNuestro.group;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.user.User;
import EsNuestro.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;


@Service
@Transactional
class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    @Autowired
    GroupService(
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository
    ) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
    }

    GroupDTO createGroup(GroupCreateDTO data, String founderUsername) {
        User founder = requireUser(founderUsername);

        Group group = new Group(data.name(), data.description());
        groupRepository.save(group);

        String nickname = (data.founderNickname() == null || data.founderNickname().isBlank())
                ? founder.getUsername()
                : data.founderNickname();

        GroupMember founderMembership = new GroupMember(
                group, founder, nickname, GroupRole.FOUNDER, MembershipStatus.ACTIVE, BigDecimal.valueOf(100)
        );
        groupMemberRepository.save(founderMembership);

        return GroupDTO.from(group);
    }

    List<GroupDTO> listMyGroups(String username) {
        return groupMemberRepository.findByUser_UsernameAndStatus(username, MembershipStatus.ACTIVE).stream()
                .map(GroupMember::getGroup)
                .map(GroupDTO::from)
                .toList();
    }

    GroupDTO getGroup(Long groupId, String callerUsername) throws ItemNotFoundException {
        requireViewer(groupId, callerUsername);
        return GroupDTO.from(requireGroup(groupId));
    }

    List<MemberDTO> listMembers(Long groupId, String callerUsername) throws ItemNotFoundException {
        requireViewer(groupId, callerUsername);
        return groupMemberRepository.findByGroup_Id(groupId).stream()
                .map(MemberDTO::from)
                .toList();
    }

    MemberDTO inviteMember(Long groupId, MemberInviteDTO data, String inviterUsername) throws ItemNotFoundException {
        Group group = requireGroup(groupId);
        GroupMember inviter = requireActiveMember(groupId, inviterUsername);
        requireAtLeast(inviter, GroupRole.ADMIN);

        User invitee = userRepository.findById(data.userId())
                .orElseThrow(() -> new ItemNotFoundException("user", data.userId()));

        if (groupMemberRepository.findByGroup_IdAndUser_Username(groupId, invitee.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already a member of this group");
        }

        GroupMember membership = new GroupMember(
                group, invitee, data.nickname(), GroupRole.MEMBER, MembershipStatus.INVITED, null
        );

        groupMemberRepository.save(membership);
        return MemberDTO.from(membership);
    }

    void acceptInvitation(Long groupId, String username) throws ItemNotFoundException {
        GroupMember membership = requireMembership(groupId, username);
        requireStatus(membership, MembershipStatus.INVITED);
        membership.accept();
    }

    void rejectInvitation(Long groupId, String username) throws ItemNotFoundException {
        GroupMember membership = requireMembership(groupId, username);
        requireStatus(membership, MembershipStatus.INVITED);
        membership.reject();
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
        GroupMember membership = requireActiveMember(groupId, username);

        groupMemberRepository.findByGroup_IdAndNicknameIgnoreCase(groupId, newNickname)
                .filter(existing -> !existing.getId().equals(membership.getId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Nickname is already taken in this group");
                });

        membership.changeNickname(newNickname);
        return MemberDTO.from(membership);
    }

    List<MemberDTO> updatePercentages(Long groupId, PercentagesUpdateDTO data, String actingUsername) throws ItemNotFoundException {
        GroupMember acting = requireActiveMember(groupId, actingUsername);
        requireAtLeast(acting, GroupRole.ADMIN);

        List<GroupMember> groupMembers = groupMemberRepository.findByGroup_Id(groupId);
        Map<Long, GroupMember> byId = groupMembers.stream()
                .collect(Collectors.toMap(GroupMember::getId, m -> m));

        List<PercentageEntryDTO> entries = data.percentages();
        Set<Long> providedIds = entries.stream().map(PercentageEntryDTO::memberId).collect(Collectors.toSet());
        if (providedIds.size() != entries.size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate member id in percentages payload");
        }

        BigDecimal sum = entries.stream()
                .map(PercentageEntryDTO::percentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Percentages must add up to exactly 100, got " + sum);
        }

        Set<Long> currentActiveIds = groupMembers.stream()
                .filter(GroupMember::isActive)
                .map(GroupMember::getId)
                .collect(Collectors.toSet());
        if (!providedIds.containsAll(currentActiveIds)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "All currently active members must be included");
        }

        for (PercentageEntryDTO entry : entries) {
            GroupMember member = byId.get(entry.memberId());
            if (member == null) {
                throw new ItemNotFoundException("group member", entry.memberId());
            }
            if (member.getStatus() != MembershipStatus.ACTIVE && member.getStatus() != MembershipStatus.PENDING) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Member " + entry.memberId() + " is not active or pending"
                );
            }
            if (member.getStatus() == MembershipStatus.PENDING) {
                member.activate(entry.percentage());
            } else {
                member.updatePercentage(entry.percentage());
            }
        }

        return groupMemberRepository.findByGroup_Id(groupId).stream().map(MemberDTO::from).toList();
    }

    List<MemberDTO> finalizeExits(Long groupId, FinalizeExitsDTO data, String actingUsername) throws ItemNotFoundException {
        GroupMember acting = requireActiveMember(groupId, actingUsername);
        requireAtLeast(acting, GroupRole.ADMIN);

        List<GroupMember> groupMembers = groupMemberRepository.findByGroup_Id(groupId);
        Map<Long, GroupMember> byId = groupMembers.stream()
                .collect(Collectors.toMap(GroupMember::getId, m -> m));

        List<GroupMember> toFinalize = new ArrayList<>();
        for (Long memberId : data.memberIds()) {
            GroupMember member = byId.get(memberId);
            if (member == null || !member.getGroup().getId().equals(groupId)) {
                throw new ItemNotFoundException("group member", memberId);
            }
            if (member.getStatus() != MembershipStatus.DEACTIVATED) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Member " + memberId + " is not deactivated and cannot be finalized"
                );
            }
            toFinalize.add(member);
        }

        List<PercentageEntryDTO> entries = data.percentages();
        Set<Long> providedIds = entries.stream().map(PercentageEntryDTO::memberId).collect(Collectors.toSet());
        if (providedIds.size() != entries.size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate member id in percentages payload");
        }

        BigDecimal sum = entries.stream()
                .map(PercentageEntryDTO::percentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Percentages must add up to exactly 100, got " + sum);
        }

        Set<Long> remainingActiveIds = groupMembers.stream()
                .filter(GroupMember::isActive)
                .map(GroupMember::getId)
                .collect(Collectors.toSet());
        if (!providedIds.equals(remainingActiveIds)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Percentages must cover exactly the members that remain active");
        }

        for (PercentageEntryDTO entry : entries) {
            byId.get(entry.memberId()).updatePercentage(entry.percentage());
        }
        toFinalize.forEach(GroupMember::finalizeExit);

        return groupMemberRepository.findByGroup_Id(groupId).stream().map(MemberDTO::from).toList();
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private Group requireGroup(Long groupId) throws ItemNotFoundException {
        return groupRepository.findById(groupId)
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

    private void requireViewer(Long groupId, String username) throws ItemNotFoundException {
        GroupMember membership = requireMembership(groupId, username);
        if (!membership.isViewer()) {
            throw new AccessDeniedException("You don't have access to this group");
        }
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
