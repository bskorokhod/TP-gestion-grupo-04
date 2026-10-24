package EsNuestro.vote.dtos;

import EsNuestro.expense.dtos.ExpenseDTO;
import EsNuestro.expense.dtos.ExpenseMemberDTO;
import EsNuestro.group.VotingModel;
import EsNuestro.vote.ConfigChangeVote;
import EsNuestro.vote.ExpenseReportVote;
import EsNuestro.vote.ExtraordinaryExpenseVote;
import EsNuestro.vote.ReservationClaimVote;
import EsNuestro.vote.TallySnapshot;
import EsNuestro.vote.Vote;
import EsNuestro.vote.VoteOutcome;
import EsNuestro.vote.VoteTally;
import EsNuestro.vote.VoteType;

import java.time.Instant;

/**
 * Fila del historial de votaciones finalizadas. A diferencia de {@link VoteDTO} no depende de quién consulta: la ve
 * cualquier miembro del grupo, haya participado o no, así que no trae {@code myChoice} ni {@code canVote}.
 * <p>
 * {@code votingModel} es el criterio con el que se votó (se fija al crear la votación, no es el actual del grupo) y
 * {@code progress} el conteo al finalizar. {@code result} es quién ganó según ese conteo: {@code IN_FAVOR} o
 * {@code AGAINST}, y null si la votación se cerró sin que el conteo la resolviera (en ese caso {@code outcome} es
 * EXECUTION_FAILED y {@code failureReason} dice por qué). Con {@code outcome} EXECUTION_FAILED y {@code result}
 * IN_FAVOR ganó el "a favor" pero la acción ya no pudo aplicarse.
 * <p>
 * Igual que en {@code VoteDTO}, solo viene el sub-objeto del tipo de la votación.
 */
public record FinishedVoteDTO(
        Long id,
        Long groupId,
        VoteType type,
        VotingModel votingModel,
        VoteOutcome outcome,
        Result result,
        String failureReason,
        ExpenseMemberDTO proposer,
        Instant createdAt,
        Instant finalizedAt,
        VoteDTO.Progress progress,
        ExpenseDTO.Details expenseProposal,
        ConfigChangeDTO configChange,
        ReservationClaimDTO reservationClaim,
        ExpenseReportDTO expenseReport
) {

    public enum Result {
        IN_FAVOR,
        AGAINST
    }

    public static FinishedVoteDTO from(Vote vote) {
        TallySnapshot tally = vote.getFinalTally() != null
                ? vote.getFinalTally()
                : TallySnapshot.of(vote.getVotingModel(), vote.tallyEntries());

        VoteDTO.Progress progress = new VoteDTO.Progress(
                tally.getYesCount(),
                tally.getNoCount(),
                tally.getPendingCount(),
                tally.getYesWeight(),
                tally.getNoWeight(),
                tally.getPendingWeight()
        );

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

        return new FinishedVoteDTO(
                vote.getId(),
                vote.getGroup().getId(),
                vote.getType(),
                vote.getVotingModel(),
                vote.getOutcome(),
                resultOf(tally.getDecision()),
                vote.getFailureReason(),
                ExpenseMemberDTO.from(vote.getProposer()),
                vote.getCreatedAt(),
                vote.getFinalizedAt(),
                progress,
                expenseProposal,
                configChange,
                reservationClaim,
                expenseReport
        );
    }

    private static Result resultOf(VoteTally.Result decision) {
        if (decision == null) {
            return null;
        }
        return switch (decision) {
            case APPROVED -> Result.IN_FAVOR;
            case REJECTED -> Result.AGAINST;
            case OPEN -> null;
        };
    }
}
