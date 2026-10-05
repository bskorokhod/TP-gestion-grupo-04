package EsNuestro.vote;

import EsNuestro.group.Group;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import EsNuestro.reservation.CancellationRequest;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Se vota si cancelar la reserva de otro miembro, a partir de una solicitud de cancelación (el reclamo).
 * Quien reclama es el proponente y su voto "sí" es automático. Votan los miembros activos al momento del
 * reclamo salvo el dueño de la reserva, y el modelo de votación es el del grupo. La ven todos los miembros,
 * incluido el dueño, aunque no vote. Si resulta positiva se cancela la reserva; si no, no se hace nada y se
 * puede volver a reclamar.
 */
@Entity
@Table(name = "reservation_claim_votes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class ReservationClaimVote extends Vote {

    @OneToOne(optional = false)
    @JoinColumn(name = "cancellation_request_id", nullable = false, unique = true)
    private CancellationRequest cancellationRequest;

    public ReservationClaimVote(
            Group group, GroupMember proposer, VotingModel votingModel, CancellationRequest cancellationRequest
    ) {
        super(group, proposer, VoteType.RESERVATION_CLAIM, votingModel);
        this.cancellationRequest = cancellationRequest;
    }

    @Override
    public boolean isVisibleTo(GroupMember member) {
        return true;
    }
}