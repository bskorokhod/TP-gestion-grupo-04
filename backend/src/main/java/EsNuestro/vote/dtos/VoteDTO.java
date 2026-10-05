package EsNuestro.vote.dtos;

import EsNuestro.expense.dtos.ExpenseDTO;
import EsNuestro.expense.dtos.ExpenseMemberDTO;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import EsNuestro.vote.Ballot;
import EsNuestro.vote.ConfigChangeVote;
import EsNuestro.vote.ExpenseReportVote;
import EsNuestro.vote.ExtraordinaryExpenseVote;
import EsNuestro.vote.ReservationClaimVote;
import EsNuestro.vote.Vote;
import EsNuestro.vote.VoteChoice;
import EsNuestro.vote.VoteOutcome;
import EsNuestro.vote.VoteStatus;
import EsNuestro.vote.VoteTally;
import EsNuestro.vote.VoteType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Vista de una votación desde la perspectiva del caller. {@code involved} son los miembros que votan;
 * {@code canVote} es si el caller es uno de ellos y la votación sigue activa. Solo se informa cuántos
 * votaron cada opción, no quién votó qué. {@code expenseProposal} solo viene en
 * EXTRAORDINARY_EXPENSE, {@code configChange} solo en CONFIG_CHANGE, {@code reservationClaim} solo en
 * RESERVATION_CLAIM y {@code expenseReport} solo en EXPENSE_REPORT (un tipo nuevo agrega su propia propuesta).
 * <p>
 * Una votación recién creada o votada puede volver ya finalizada (status/outcome): así el cliente sabe
 * si el gasto se creó, se rechazó o no pudo ejecutarse ({@code failureReason}).
 */
public record VoteDTO(
        Long id,
        Long groupId,
        VoteType type,
        VotingModel votingModel,
        VoteStatus status,
        VoteOutcome outcome,
        String failureReason,
        ExpenseMemberDTO proposer,
        Instant createdAt,
        List<ExpenseMemberDTO> involved,
        Progress progress,
        VoteChoice myChoice,
        boolean canVote,
        ExpenseDTO.Details expenseProposal,
        ConfigChangeDTO configChange,
        ReservationClaimDTO reservationClaim,
        ExpenseReportDTO expenseReport
) {

    /** Votos por opción; los pesos son 1 por miembro, salvo en la mayoría ponderada (% de propiedad). */
    public record Progress(
            int yes,
            int no,
            int pending,
            BigDecimal yesWeight,
            BigDecimal noWeight,
            BigDecimal pendingWeight
    ) {
    }

    public static VoteDTO from(Vote vote, GroupMember caller) {
        List<Ballot> eligible = vote.eligibleBallots();
        VoteTally.Totals totals = VoteTally.totals(vote.getVotingModel(), vote.tallyEntries());

        Progress progress = new Progress(
                countChoice(eligible, VoteChoice.YES),
                countChoice(eligible, VoteChoice.NO),
                countChoice(eligible, null),
                totals.yes(),
                totals.no(),
                totals.pending()
        );

        Ballot mine = eligible.stream()
                .filter(ballot -> ballot.getMember().getId().equals(caller.getId()))
                .findFirst()
                .orElse(null);

        ExpenseDTO.Details expenseProposal = vote instanceof ExtraordinaryExpenseVote expenseVote
                ? ExpenseDTO.Details.from(expenseVote.getProposedDetails())
                : null;

        ConfigChangeDTO configChange = vote instanceof ConfigChangeVote changeVote
                ? ConfigChangeDTO.from(changeVote)
                : null;

        ReservationClaimDTO reservationClaim = vote instanceof ReservationClaimVote claimVote
                ? ReservationClaimDTO.from(claimVote)
                : null;

        ExpenseReportDTO expenseReport = vote instanceof ExpenseReportVote reportVote
                ? ExpenseReportDTO.from(reportVote)
                : null;

        return new VoteDTO(
                vote.getId(),
                vote.getGroup().getId(),
                vote.getType(),
                vote.getVotingModel(),
                vote.getStatus(),
                vote.getOutcome(),
                vote.getFailureReason(),
                ExpenseMemberDTO.from(vote.getProposer()),
                vote.getCreatedAt(),
                eligible.stream().map(ballot -> ExpenseMemberDTO.from(ballot.getMember())).toList(),
                progress,
                mine == null ? null : mine.getChoice(),
                mine != null && vote.isActive(),
                expenseProposal,
                configChange,
                reservationClaim,
                expenseReport
        );
    }

    private static int countChoice(List<Ballot> ballots, VoteChoice choice) {
        return (int) ballots.stream().filter(ballot -> ballot.getChoice() == choice).count();
    }
}
