package EsNuestro.member;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    Optional<GroupMember> findByGroup_IdAndUser_Email(Long groupId, String email);

    List<GroupMember> findByGroup_Id(Long groupId);

    List<GroupMember> findByUser_EmailAndStatus(String email, MembershipStatus status);

    List<GroupMember> findByUser_EmailAndStatusIn(String email, Collection<MembershipStatus> statuses);

    List<GroupMember> findByGroup_IdAndNicknameIgnoreCaseAndStatusIn(
            Long groupId, String nickname, Collection<MembershipStatus> statuses
    );
}