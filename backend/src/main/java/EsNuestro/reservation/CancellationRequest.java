package EsNuestro.reservation;

import EsNuestro.member.GroupMember;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "reservation_cancellation_requests")
@NoArgsConstructor
@Getter
public class CancellationRequest {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @ManyToOne(optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private GroupMember requester;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CancellationRequestStatus status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private CancellationRequest(Reservation reservation, GroupMember requester, String reason) {
        this.reservation = reservation;
        this.requester = requester;
        this.reason = reason;
        this.status = CancellationRequestStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public static CancellationRequest create(Reservation reservation, GroupMember requester, String reason) {
        return new CancellationRequest(reservation, requester, reason);
    }
}
