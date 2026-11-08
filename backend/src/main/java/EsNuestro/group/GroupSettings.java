package EsNuestro.group;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Configuración que se elige al crear el grupo. Sus columnas viven en la tabla {@code groups}.
 * Hoy solo se aplica en gastos (en un grupo EQUAL se rechaza el reparto proporcional) y en el plazo de
 * cierre de las votaciones; el resto de las opciones (reservas) solo se persiste: cada enum documenta
 * cómo se usará. Las combinaciones incoherentes se rechazan acá, de modo que no
 * pueda existir un grupo con ellas aunque se salte la validación del DTO.
 */
@Embeddable
@NoArgsConstructor
@Getter
public class GroupSettings {

    public static final int MIN_FIXED_DAYS_PER_MONTH = 1;
    public static final int MAX_FIXED_DAYS_PER_MONTH = 31;

    public static final int MIN_VOTE_DEADLINE_DAYS = 7;
    public static final int MAX_VOTE_DEADLINE_DAYS = 30;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DistributionMode distributionMode;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VotingModel votingModel;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReservationLimitPolicy reservationLimitPolicy;

    /** Solo tiene valor cuando {@link #reservationLimitPolicy} es FIXED_DAYS_PER_MONTH; si no, es null. */
    private Integer reservationFixedDaysPerMonth;

    /**
     * Monto a partir del cual un gasto se considera "extraordinario": un gasto cuyo
     * {@code totalAmount} alcanza este valor lo es. Mismo formato que {@code ExpenseDetails.totalAmount}.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal extraordinaryExpenseThreshold;

    /**
     * Días que tiene una votación para cerrarse antes de rechazarse automáticamente por no alcanzar el
     * quórum a tiempo. Se fija al crear cada votación (ver {@code EsNuestro.vote.Vote}), así que cambiar
     * este valor no altera el plazo de una votación en curso. Lo aplica {@code EsNuestro.vote.VoteExpirationJob}.
     */
    @Column(nullable = false)
    private Integer voteDeadlineDays;

    public GroupSettings(
            DistributionMode distributionMode,
            VotingModel votingModel,
            ReservationLimitPolicy reservationLimitPolicy,
            Integer reservationFixedDaysPerMonth,
            BigDecimal extraordinaryExpenseThreshold,
            Integer voteDeadlineDays
    ) {
        if (distributionMode == null || votingModel == null || reservationLimitPolicy == null
                || extraordinaryExpenseThreshold == null || voteDeadlineDays == null) {
            throw new IllegalArgumentException("Group settings are incomplete");
        }
        if (!isVotingModelAllowed(distributionMode, votingModel)) {
            throw new IllegalArgumentException(
                    "Voting model " + votingModel + " is not compatible with distribution mode " + distributionMode
            );
        }
        if (!isReservationPolicyAllowed(distributionMode, reservationLimitPolicy)) {
            throw new IllegalArgumentException(
                    "Reservation policy " + reservationLimitPolicy
                            + " is not compatible with distribution mode " + distributionMode
            );
        }
        if (!isFixedDaysConsistent(reservationLimitPolicy, reservationFixedDaysPerMonth)) {
            throw new IllegalArgumentException(
                    "Fixed days per month must be set (between " + MIN_FIXED_DAYS_PER_MONTH + " and "
                            + MAX_FIXED_DAYS_PER_MONTH + ") if and only if the reservation policy is FIXED_DAYS_PER_MONTH"
            );
        }
        if (extraordinaryExpenseThreshold.signum() <= 0) {
            throw new IllegalArgumentException("Extraordinary expense threshold must be positive");
        }
        if (voteDeadlineDays < MIN_VOTE_DEADLINE_DAYS || voteDeadlineDays > MAX_VOTE_DEADLINE_DAYS) {
            throw new IllegalArgumentException(
                    "Vote deadline must be between " + MIN_VOTE_DEADLINE_DAYS + " and " + MAX_VOTE_DEADLINE_DAYS + " days"
            );
        }

        this.distributionMode = distributionMode;
        this.votingModel = votingModel;
        this.reservationLimitPolicy = reservationLimitPolicy;
        this.reservationFixedDaysPerMonth = reservationFixedDaysPerMonth;
        this.extraordinaryExpenseThreshold = extraordinaryExpenseThreshold.setScale(2, RoundingMode.HALF_UP);
        this.voteDeadlineDays = voteDeadlineDays;
    }

    /**
     * Un gasto es extraordinario si su monto alcanza el umbral (mayor o igual). Un gasto extraordinario no se
     * crea directamente: se somete a votación.
     */
    public boolean isExtraordinary(BigDecimal totalAmount) {
        return totalAmount.compareTo(extraordinaryExpenseThreshold) >= 0;
    }

    /**
     * Copia con otro modo de repartición. Las cinco variantes {@code with...} validan la combinación
     * resultante con el constructor y lanzan {@link IllegalArgumentException} si es incoherente.
     */
    public GroupSettings withDistributionMode(DistributionMode newDistributionMode) {
        return new GroupSettings(
                newDistributionMode, votingModel, reservationLimitPolicy,
                reservationFixedDaysPerMonth, extraordinaryExpenseThreshold, voteDeadlineDays
        );
    }

    /** Copia con otro modelo de aprobación de votaciones. */
    public GroupSettings withVotingModel(VotingModel newVotingModel) {
        return new GroupSettings(
                distributionMode, newVotingModel, reservationLimitPolicy,
                reservationFixedDaysPerMonth, extraordinaryExpenseThreshold, voteDeadlineDays
        );
    }

    /** Copia con otra restricción de reservas; los días fijos van si y solo si es FIXED_DAYS_PER_MONTH. */
    public GroupSettings withReservationLimit(ReservationLimitPolicy newPolicy, Integer newFixedDaysPerMonth) {
        return new GroupSettings(
                distributionMode, votingModel, newPolicy, newFixedDaysPerMonth,
                extraordinaryExpenseThreshold, voteDeadlineDays
        );
    }

    /** Copia con otro monto a partir del cual un gasto es extraordinario. */
    public GroupSettings withExtraordinaryExpenseThreshold(BigDecimal newThreshold) {
        return new GroupSettings(
                distributionMode, votingModel, reservationLimitPolicy, reservationFixedDaysPerMonth,
                newThreshold, voteDeadlineDays
        );
    }

    /** Copia con otro plazo (en días) de cierre de las votaciones. */
    public GroupSettings withVoteDeadlineDays(Integer newVoteDeadlineDays) {
        return new GroupSettings(
                distributionMode, votingModel, reservationLimitPolicy, reservationFixedDaysPerMonth,
                extraordinaryExpenseThreshold, newVoteDeadlineDays
        );
    }

    /** Un modelo de votación que depende de la propiedad no tiene sentido si el bien se reparte en partes iguales. */
    public static boolean isVotingModelAllowed(DistributionMode distribution, VotingModel voting) {
        return distribution.hasOwnershipPercentages() || !voting.dependsOnOwnership();
    }

    /** Idem para la política de reservas. */
    public static boolean isReservationPolicyAllowed(DistributionMode distribution, ReservationLimitPolicy policy) {
        return distribution.hasOwnershipPercentages() || !policy.dependsOnOwnership();
    }

    /** Los días fijos deben estar (y en rango) si y solo si la política es FIXED_DAYS_PER_MONTH. */
    public static boolean isFixedDaysConsistent(ReservationLimitPolicy policy, Integer fixedDays) {
        if (policy == ReservationLimitPolicy.FIXED_DAYS_PER_MONTH) {
            return fixedDays != null
                    && fixedDays >= MIN_FIXED_DAYS_PER_MONTH
                    && fixedDays <= MAX_FIXED_DAYS_PER_MONTH;
        }
        return fixedDays == null;
    }
}
