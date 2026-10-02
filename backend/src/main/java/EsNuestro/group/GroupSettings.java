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
 * Todavía no se aplica en ningún flujo (votaciones, reservas, gastos): hoy solo se persiste; cada
 * enum documenta cómo se usará. Las combinaciones incoherentes se rechazan acá, de modo que no
 * pueda existir un grupo con ellas aunque se salte la validación del DTO.
 */
@Embeddable
@NoArgsConstructor
@Getter
public class GroupSettings {

    public static final int MIN_FIXED_DAYS_PER_MONTH = 1;
    public static final int MAX_FIXED_DAYS_PER_MONTH = 31;

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

    public GroupSettings(
            DistributionMode distributionMode,
            VotingModel votingModel,
            ReservationLimitPolicy reservationLimitPolicy,
            Integer reservationFixedDaysPerMonth,
            BigDecimal extraordinaryExpenseThreshold
    ) {
        if (distributionMode == null || votingModel == null || reservationLimitPolicy == null
                || extraordinaryExpenseThreshold == null) {
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

        this.distributionMode = distributionMode;
        this.votingModel = votingModel;
        this.reservationLimitPolicy = reservationLimitPolicy;
        this.reservationFixedDaysPerMonth = reservationFixedDaysPerMonth;
        this.extraordinaryExpenseThreshold = extraordinaryExpenseThreshold.setScale(2, RoundingMode.HALF_UP);
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
