package EsNuestro.reservation;

import EsNuestro.common.time.AppTime;
import EsNuestro.group.Group;
import EsNuestro.group.GroupService;
import EsNuestro.group.MemberLeftEvent;
import EsNuestro.member.GroupMember;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Al abandonar el grupo se cancelan las reservas vigentes del saliente y se cierran los reclamos sobre ellas. */
class ReservationsOnLeavingTest {

    private static final Long GROUP_ID = 1L;
    private static final Long LEAVER_ID = 2L;

    private ReservationRepository repository;
    private ApplicationEventPublisher events;
    private ReservationService service;
    private GroupMember leaver;

    @BeforeEach
    void setUp() {
        repository = mock(ReservationRepository.class);
        events = mock(ApplicationEventPublisher.class);
        service = new ReservationService(repository, mock(CancellationRequestRepository.class), mock(GroupService.class), events);
        leaver = mock(GroupMember.class);
        when(leaver.getGroup()).thenReturn(mock(Group.class));
        when(leaver.getId()).thenReturn(LEAVER_ID);
    }

    private Reservation reservation(long id, LocalDate start, LocalDate end) {
        Reservation reservation = Reservation.create(leaver, start, end);
        ReflectionTestUtils.setField(reservation, "id", id);
        return reservation;
    }

    @Test
    void theLeaversUpcomingAndInProgressReservationsAreCancelledAndTheirClaimsClosedViaTheEvent() {
        LocalDate today = AppTime.today();
        Reservation upcoming = reservation(10, today.plusDays(5), today.plusDays(8));
        Reservation inProgress = reservation(11, today.minusDays(1), today.plusDays(1));
        when(repository.findByMember_IdAndStatusAndEndDateGreaterThanEqual(eq(LEAVER_ID), eq(ReservationStatus.ACTIVE), any()))
                .thenReturn(List.of(upcoming, inProgress));

        service.onMemberLeft(new MemberLeftEvent(GROUP_ID, LEAVER_ID));

        assertThat(upcoming.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        assertThat(inProgress.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        // Ese evento es el que hace que VoteService cierre los reclamos abiertos sobre la reserva.
        verify(events).publishEvent(new ReservationCancelledEvent(GROUP_ID, 10L));
        verify(events).publishEvent(new ReservationCancelledEvent(GROUP_ID, 11L));
    }

    @Test
    void onlyTheLeaversReservationsAreQueriedNotOthersNorPastNorCancelledOnes() {
        when(repository.findByMember_IdAndStatusAndEndDateGreaterThanEqual(any(), any(), any())).thenReturn(List.of());

        service.onMemberLeft(new MemberLeftEvent(GROUP_ID, LEAVER_ID));

        verify(repository).findByMember_IdAndStatusAndEndDateGreaterThanEqual(
                LEAVER_ID, ReservationStatus.ACTIVE, AppTime.today());
        verify(events, never()).publishEvent(any(Object.class));
    }
}
