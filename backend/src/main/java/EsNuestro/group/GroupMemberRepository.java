package EsNuestro.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    Optional<GroupMember> findByGroup_IdAndUser_Username(Long groupId, String username);

    List<GroupMember> findByGroup_Id(Long groupId);

    List<GroupMember> findByUser_UsernameAndStatus(String username, MembershipStatus status);

    List<GroupMember> findByUser_UsernameAndStatusIn(String username, Collection<MembershipStatus> statuses);

    List<GroupMember> findByGroup_IdAndNicknameIgnoreCaseAndStatusIn(
            Long groupId, String nickname, Collection<MembershipStatus> statuses
    );
}