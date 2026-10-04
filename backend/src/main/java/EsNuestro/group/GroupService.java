package EsNuestro.group;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.expense.DebtRepository;
import EsNuestro.group.dtos.GroupCreateDTO;
import EsNuestro.group.dtos.GroupDTO;
import EsNuestro.group.dtos.GroupPreviewDTO;
import EsNuestro.group.dtos.JoinGroupDTO;
import EsNuestro.member.GroupMember;
import EsNuestro.member.GroupMemberRepository;
import EsNuestro.member.MemberColor;
import EsNuestro.member.MembershipStatus;
import EsNuestro.member.dtos.FinalizeExitsDTO;
import EsNuestro.member.dtos.JoinRequestDTO;
import EsNuestro.member.dtos.MemberDTO;
import EsNuestro.member.dtos.PercentageUpdateDTO;
import EsNuestro.user.User;
import EsNuestro.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ApplicationEventPublisher eventPublisher;
    private final Random colorRandom = new Random();

    @Autowired
    GroupService(
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            JoinCodeGenerator joinCodeGenerator,
            DebtRepository debtRepository,
            ApplicationEventPublisher eventPublisher
    ) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.joinCodeGenerator = joinCodeGenerator;
        this.debtRepository = debtRepository;
        this.eventPublisher = eventPublisher;
    }

    GroupDTO createGroup(GroupCreateDTO data, String founderEmail) {
        User founder = requireUser(founderEmail);

        BigDecimal founderPercentage = data.settings().distributionMode().hasOwnershipPercentages()
                ? PercentageDistribution.requireValidPercentage(data.founderPercentage())
                : Group.TOTAL_PERCENTAGE;

        Group group = new Group(
                data.name(), data.description(), generateUniqueJoinCode(), data.settings().toEntity()
        );
        groupRepository.save(group);

        String nickname = (data.founderNickname() == null || data.founderNickname().isBlank())
                ? resolveDefaultNickname(founder)
                : data.founderNickname().strip();

        GroupMember founderMembership = GroupMember.founder(
                group, founder, nickname, pickColor(group.getId(), nickname, null), founderPercentage
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
        BigDecimal requestedPercentage = requestedPercentageFor(group, data.percentage());
        GroupMember membership = groupMemberRepository.findByGroup_IdAndUser_Email(group.getId(), email)
                .map(existing -> requestAgain(existing, nickname, requestedPercentage))
                .orElseGet(() -> createJoinRequest(group, user, nickname, requestedPercentage));

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

        return groupMemberRepository.findByGroup_Id(groupId).stream()
                .filter(member -> status == null || member.getStatus() == status)
                .map(MemberDTO::from)
                .toList();
    }

    MemberDTO approveJoinRequest(Long groupId, Long memberId, String actingEmail) throws ItemNotFoundException {
        Group group = requireGroupForUpdate(groupId);
        GroupMember target = requirePendingRequestManagedBy(groupId, memberId, actingEmail);

        // Entre el envío y la aprobación la suma pudo cambiar: se vuelve a validar con el mismo mensaje genérico.
        if (group.getSettings().getDistributionMode().hasOwnershipPercentages()) {
            if (target.getPercentage() == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "The application does not include an ownership percentage, the applicant must send it again"
                );
            }
            PercentageDistribution.requireRoomToJoin(group, target.getPercentage());
        }

        target.approve();
        group.refreshOwnership();
        return MemberDTO.from(target);
    }

    MemberDTO rejectJoinRequest(Long groupId, Long memberId, String actingEmail) throws ItemNotFoundException {
        GroupMember target = requirePendingRequestManagedBy(groupId, memberId, actingEmail);
        target.reject();
        return MemberDTO.from(target);
    }

    void leaveGroup(Long groupId, String email) throws ItemNotFoundException {
        Group group = requireGroupForUpdate(groupId);
        GroupMember membership = requireActiveMember(groupId, email);

        requireNoUnsettledDebts(membership);
        membership.deactivateForLeaving();
        // Su porcentaje deja de computarse; si queda un único activo en modo porcentual, pasa a tener 100%.
        group.refreshOwnership();
        // Las votaciones activas dejan de contar a este miembro y pueden quedar resueltas.
        eventPublisher.publishEvent(new MemberLeftEvent(groupId, membership.getId()));
    }

    MemberDTO changeNickname(Long groupId, String email, String newNickname) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        GroupMember membership = requireActiveMember(groupId, email);

        String nickname = newNickname.strip();
        membership.changeIdentity(nickname, pickColor(groupId, nickname, membership));
        return MemberDTO.from(membership);
    }

    MemberDTO updateMyPercentage(Long groupId, PercentageUpdateDTO data, String actingEmail) throws ItemNotFoundException {
        Group group = requireGroupForUpdate(groupId);
        GroupMember member = requireActiveMember(groupId, actingEmail);

        if (!group.getSettings().getDistributionMode().hasOwnershipPercentages()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "In equitable mode, the percentages are calculated automatically and cannot be modified"
            );
        }

        BigDecimal percentage = PercentageDistribution.requireValidPercentage(data.percentage());
        PercentageDistribution.requireWithinTotalAfterChange(group.activeMembers(), member, percentage);

        member.updatePercentage(percentage);
        return MemberDTO.from(member);
    }

    List<MemberDTO> finalizeExits(Long groupId, FinalizeExitsDTO data, String actingEmail) throws ItemNotFoundException {
        requireGroupForUpdate(groupId);
        requireActiveMember(groupId, actingEmail);

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

        // Los porcentajes de los inactivos ya no se computan desde la baja: acá solo se cierra la salida.
        toFinalize.forEach(GroupMember::finalizeExit);

        return members.stream().map(MemberDTO::from).toList();
    }

    private GroupMember createJoinRequest(Group group, User user, String nickname, BigDecimal requestedPercentage) {
        GroupMember request = GroupMember.joinRequest(
                group, user, nickname, pickColor(group.getId(), nickname, null), requestedPercentage
        );
        return groupMemberRepository.save(request);
    }

    private GroupMember requestAgain(GroupMember member, String nickname, BigDecimal requestedPercentage) {
        requireCanRequestAgain(member);
        member.requestAgain(nickname, pickColor(member.getGroup().getId(), nickname, member), requestedPercentage);
        return member;
    }

    /**
     * Porcentaje que se guarda en la solicitud: null en modo equitativo; en porcentual, el pedido ya validado.
     * Si con él la suma superaría 100 se frena con un mensaje genérico, igual con el grupo detenido o funcionando.
     */
    private BigDecimal requestedPercentageFor(Group group, BigDecimal requested) {
        if (!group.getSettings().getDistributionMode().hasOwnershipPercentages()) {
            return null;
        }
        BigDecimal percentage = PercentageDistribution.requireValidPercentage(requested);
        PercentageDistribution.requireRoomToJoin(group, percentage);
        return percentage;
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
        requireActiveMember(groupId, actingEmail);

        GroupMember target = requireMemberById(groupId, memberId);
        requireStatus(target, MembershipStatus.PENDING);
        return target;
    }

    /**
     * Con el grupo detenido no se agregan ni proponen gastos, no se proponen cambios de configuración y no se
     * reserva. Siempre se llama después de verificar la membresía del caller, para no revelar el estado a ajenos.
     */
    public void requireRunning(Group group) {
        if (group.isStopped()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The group is stopped. Another " + PercentageDistribution.format(group.missingPercentage()) +
                            "% needs to be allocated to reach 100%"
            );
        }
    }

    private MemberColor pickColor(Long groupId, String nickname, GroupMember current) {
        List<GroupMember> groupMembers = groupMemberRepository
                .findByGroup_IdAndStatusIn(groupId, MembershipStatus.IDENTITY_OCCUPYING)
                .stream()
                .filter(member -> current == null || !member.getId().equals(current.getId()))
                .toList();

        // Invariante duro: dos miembros con el MISMO apodo nunca comparten color.
        // Estos colores quedan prohibidos para este nickname.
        Set<MemberColor> sameNickTaken = groupMembers.stream()
                .filter(member -> member.getNickname().equalsIgnoreCase(nickname))
                .map(GroupMember::getColor)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(MemberColor.class)));

        // Si ya tenia color y no choca con su mismo apodo, se lo conservamos (estabilidad al renombrarse).
        MemberColor currentColor = current == null ? null : current.getColor();
        if (currentColor != null && !sameNickTaken.contains(currentColor)) {
            return currentColor;
        }

        // Cuantos miembros del grupo usan cada color (para priorizar libres y, si no, el menos usado).
        Map<MemberColor, Long> usage = new EnumMap<>(MemberColor.class);
        for (MemberColor color : MemberColor.values()) {
            usage.put(color, 0L);
        }
        groupMembers.stream()
                .map(GroupMember::getColor)
                .filter(Objects::nonNull)
                .forEach(color -> usage.merge(color, 1L, Long::sum));

        // Candidatos: cualquier color que no colisione con el mismo apodo.
        List<MemberColor> allowed = Arrays.stream(MemberColor.values())
                .filter(color -> !sameNickTaken.contains(color))
                .toList();
        if (allowed.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Nickname is already used by too many members in this group"
            );
        }

        // Preferimos el menos usado del grupo (0 = libre mientras haya) y desempatamos al azar.
        long minUsage = allowed.stream().mapToLong(color -> usage.get(color)).min().orElse(0L);
        List<MemberColor> pool = allowed.stream()
                .filter(color -> usage.get(color) == minUsage)
                .toList();

        return pool.get(colorRandom.nextInt(pool.size()));
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