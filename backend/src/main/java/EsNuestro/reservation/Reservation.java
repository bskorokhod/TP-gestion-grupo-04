package EsNuestro.reservation;

import EsNuestro.group.Group;
import EsNuestro.member.GroupMember;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "reservations")
@NoArgsConstructor
@Getter
public class Reservation {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private GroupMember member;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReservationStatus status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Reservation(GroupMember member, LocalDate startDate, LocalDate endDate) {
        this.group = member.getGroup();
        this.member = member;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = ReservationStatus.ACTIVE;
        this.createdAt = Instant.now();
    }

    public static Reservation create(GroupMember member, LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Reservation start date must not be after end date");
        }
        return new Reservation(member, startDate, endDate);
    }

    public void cancel() {
        if (status != ReservationStatus.ACTIVE) {
            throw new IllegalStateException("Only active reservations can be cancelled");
        }
        status = ReservationStatus.CANCELLED;
    }
}
