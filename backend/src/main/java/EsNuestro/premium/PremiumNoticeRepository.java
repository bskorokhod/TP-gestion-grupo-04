package EsNuestro.premium;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

interface PremiumNoticeRepository extends JpaRepository<PremiumNotice, Long> {

    /** Avisos del grupo posteriores a un instante, del más viejo al más nuevo. */
    List<PremiumNotice> findByGroup_IdAndOccurredAtAfterOrderByOccurredAtAsc(Long groupId, Instant after);
}
