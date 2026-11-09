package EsNuestro.premium;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

interface PremiumNoticeReadRepository extends JpaRepository<PremiumNoticeRead, Long> {

    Optional<PremiumNoticeRead> findByUserIdAndGroupId(Long userId, Long groupId);
}
