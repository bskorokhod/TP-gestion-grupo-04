package EsNuestro.reservation;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.group.Group;
import EsNuestro.group.ReservationLimitPolicy;
import EsNuestro.group.GroupService;
import EsNuestro.member.GroupMember;
import EsNuestro.member.MembershipStatus;
import EsNuestro.reservation.dtos.CancellationRequestCreateDTO;
import EsNuestro.reservation.dtos.CancellationRequestDTO;
import EsNuestro.reservation.dtos.ReservationCreateDTO;
import EsNuestro.reservation.dtos.ReservationDTO;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
class ReservationService {

    private final ReservationRepository reservationRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final GroupService groupService;

    ReservationService(
            ReservationRepository reservationRepository,
            CancellationRequestRepository cancellationRequestRepository,
            GroupService groupService
    ) {
        this.reservationRepository = reservationRepository;
        this.cancellationRequestRepository = cancellationRequestRepository;
        this.groupService = groupService;
    }

    List<ReservationDTO> listReservations(Long groupId, String email) throws ItemNotFoundException {
        groupService.requireViewer(groupId, email);
        return reservationRepository.findByGroup_IdOrderByStartDateAsc(groupId).stream()
                .map(ReservationDTO::from)
                .toList();
    }

    ReservationDTO createReservation(
            Long groupId,
            ReservationCreateDTO data,
            String email
    ) throws ItemNotFoundException {
        Group group = groupService.requireGroupForUpdate(groupId);
        GroupMember member = groupService.requireActiveMember(groupId, email);
        groupService.requireRunning(group);
        validateDates(data.startDate(), data.endDate());

        boolean overlaps = reservationRepository.findByGroup_IdOrderByStartDateAsc(groupId).stream()
                .filter(reservation -> reservation.getStatus() == ReservationStatus.ACTIVE)
                .anyMatch(reservation -> overlaps(
                        data.startDate(),
                        data.endDate(),
                        reservation.getStartDate(),
                        reservation.getEndDate()
                ));
        if (overlaps) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The requested dates are not available");
        }
        validateMonthlyLimit(member, data.startDate(), data.endDate());

        Reservation reservation = Reservation.create(member, data.startDate(), data.endDate());
        return ReservationDTO.from(reservationRepository.save(reservation));
    }

    void cancelOwnReservation(Long groupId, Long reservationId, String email) throws ItemNotFoundException {
        groupService.requireGroupForUpdate(groupId);
        GroupMember member = groupService.requireActiveMember(groupId, email);
        Reservation reservation = requireReservationForUpdate(groupId, reservationId);
        if (!reservation.getMember().getId().equals(member.getId())) {
            throw new AccessDeniedException("Only the reservation owner can cancel it directly");
        }
        requireActive(reservation);
        reservation.cancel();
    }

    CancellationRequestDTO requestCancellation(
            Long groupId,
            Long reservationId,
            CancellationRequestCreateDTO data,
            String email
    ) throws ItemNotFoundException {
        groupService.requireGroupForUpdate(groupId);
        GroupMember requester = groupService.requireActiveMember(groupId, email);
        Reservation reservation = requireReservationForUpdate(groupId, reservationId);
        requireActive(reservation);
        if (reservation.getMember().getId().equals(requester.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The owner must cancel their own reservation directly"
            );
        }
        if (cancellationRequestRepository
                .findByReservation_IdAndStatus(reservationId, CancellationRequestStatus.PENDING)
                .isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "There is already a pending cancellation request for this reservation"
            );
        }

        String reason = data.reason().strip();
        CancellationRequest request = CancellationRequest.create(reservation, requester, reason);
        return CancellationRequestDTO.from(cancellationRequestRepository.save(request));
    }

    List<CancellationRequestDTO> listCancellationRequests(Long groupId, String email)
            throws ItemNotFoundException {
        groupService.requireViewer(groupId, email);
        return cancellationRequestRepository.findByReservation_Group_IdOrderByCreatedAtDesc(groupId).stream()
                .map(CancellationRequestDTO::from)
                .toList();
    }

    private Reservation requireReservationForUpdate(Long groupId, Long reservationId)
            throws ItemNotFoundException {
        Reservation reservation = reservationRepository.findWithLockById(reservationId)
                .orElseThrow(() -> new ItemNotFoundException("reservation", reservationId));
        if (!reservation.getGroup().getId().equals(groupId)) {
            throw new ItemNotFoundException("reservation", reservationId);
        }
        return reservation;
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date must not be after end date");
        }
        if (startDate.isBefore(tomorrow)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reservations must start at least tomorrow"
            );
        }
    }

    private void validateMonthlyLimit(
            GroupMember member,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Group group = member.getGroup();
        ReservationLimitPolicy policy = group.getSettings().getReservationLimitPolicy();
        int activeMembers = (int) group.getMembers().stream()
                .filter(groupMember -> groupMember.getStatus() == MembershipStatus.ACTIVE)
                .count();

        LocalDate month = startDate.withDayOfMonth(1);
        while (!month.isAfter(endDate)) {
            YearMonth yearMonth = YearMonth.from(month);
            LocalDate monthEnd = yearMonth.atEndOfMonth();
            LocalDate requestedMonthStart = startDate.isAfter(month) ? startDate : month;
            LocalDate requestedMonthEnd = endDate.isBefore(monthEnd) ? endDate : monthEnd;
            long requestedDays = daysInclusive(requestedMonthStart, requestedMonthEnd);
            long alreadyReserved = reservationRepository
                    .findByGroup_IdOrderByStartDateAsc(group.getId()).stream()
                    .filter(reservation -> reservation.getStatus() == ReservationStatus.ACTIVE)
                    .filter(reservation -> reservation.getMember().getId().equals(member.getId()))
                    .mapToLong(reservation -> daysInMonth(reservation, yearMonth))
                    .sum();

            long limit = switch (policy) {
                case FIXED_DAYS_PER_MONTH -> group.getSettings().getReservationFixedDaysPerMonth();
                case EQUAL -> yearMonth.lengthOfMonth() / Math.max(activeMembers, 1);
                case OWNERSHIP_PROPORTIONAL -> maxOwnershipDays(group, member, yearMonth);
            };
            if (alreadyReserved + requestedDays > limit) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "La reserva supera el límite mensual de días permitido para este grupo"
                );
            }
            month = month.plusMonths(1);
        }
    }

    private int maxOwnershipDays(Group group, GroupMember member, YearMonth month) {
        if (member.getPercentage() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The member has no ownership percentage configured"
            );
        }
        return group.getMembers().stream()
                .filter(groupMember -> groupMember.getStatus() == MembershipStatus.ACTIVE)
                .findFirst()
                .map(ignored -> (int) Math.floor(
                        month.lengthOfMonth() * member.getPercentage().doubleValue() / 100
                ))
                .orElse(0);
    }

    private long daysInMonth(Reservation reservation, YearMonth month) {
        LocalDate start = reservation.getStartDate().isAfter(month.atDay(1))
                ? reservation.getStartDate()
                : month.atDay(1);
        LocalDate end = reservation.getEndDate().isBefore(month.atEndOfMonth())
                ? reservation.getEndDate()
                : month.atEndOfMonth();
        return start.isAfter(end) ? 0 : daysInclusive(start, end);
    }

    private long daysInclusive(LocalDate start, LocalDate end) {
        return ChronoUnit.DAYS.between(start, end) + 1;
    }

    private void requireActive(Reservation reservation) {
        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The reservation is not active");
        }
    }

    private boolean overlaps(LocalDate start, LocalDate end, LocalDate otherStart, LocalDate otherEnd) {
        return !start.isAfter(otherEnd) && !otherStart.isAfter(end);
    }
}
