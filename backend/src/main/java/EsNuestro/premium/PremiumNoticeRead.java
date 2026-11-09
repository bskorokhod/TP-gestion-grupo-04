package EsNuestro.premium;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Hasta cuándo un usuario ya vio los avisos premium de un grupo. Si no hay fila, vale desde que el usuario se unió al
 * grupo: un miembro nuevo no recibe avisos de hechos anteriores a su ingreso.
 */
@Entity
@Table(
        name = "premium_notice_reads",
        uniqueConstraints = @UniqueConstraint(name = "uk_premium_notice_read", columnNames = {"user_id", "group_id"})
)
@NoArgsConstructor
@Getter
public class PremiumNoticeRead {

    @Id
    @GeneratedValue
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(nullable = false)
    private Instant lastSeenAt;

    PremiumNoticeRead(Long userId, Long groupId, Instant lastSeenAt) {
        this.userId = userId;
        this.groupId = groupId;
        this.lastSeenAt = lastSeenAt;
    }

    void seenUntil(Instant instant) {
        this.lastSeenAt = instant;
    }
}
