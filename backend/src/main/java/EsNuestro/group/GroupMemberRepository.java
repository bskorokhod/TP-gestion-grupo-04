package EsNuestro.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    Optional<GroupMember> findByGroup_IdAndUser_Username(Long groupId, String username);

    Optional<GroupMember> findByGroup_IdAndNicknameIgnoreCase(Long groupId, String nickname);

    List<GroupMember> findByGroup_Id(Long groupId);

    List<GroupMember> findByUser_UsernameAndStatus(String username, MembershipStatus status);
}
