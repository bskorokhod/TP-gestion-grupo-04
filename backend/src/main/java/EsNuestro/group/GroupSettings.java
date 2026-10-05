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
 * Hoy solo se aplica en gastos (en un grupo EQUAL se rechaza el reparto proporcional); el resto de
 * las opciones (votaciones, reservas) solo se persiste: cada enum documenta cómo se usará. Las
 * combinaciones incoherentes se rechazan acá, de modo que no
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

    /**
     * Un gasto es extraordinario si su monto alcanza el umbral (mayor o igual). Un gasto extraordinario no se
     * crea directamente: se somete a votación.
     */
    public boolean isExtraordinary(BigDecimal totalAmount) {
        return totalAmount.compareTo(extraordinaryExpenseThreshold) >= 0;
    }

    /**
     * Copia con otro modo de repartición. Las cuatro variantes {@code with...} validan la combinación
     * resultante con el constructor y lanzan {@link IllegalArgumentException} si es incoherente.
     */
    public GroupSettings withDistributionMode(DistributionMode newDistributionMode) {
        return new GroupSettings(
                newDistributionMode, votingModel, reservationLimitPolicy,
                reservationFixedDaysPerMonth, extraordinaryExpenseThreshold
        );
    }

    /** Copia con otro modelo de aprobación de votaciones. */
    public GroupSettings withVotingModel(VotingModel newVotingModel) {
        return new GroupSettings(
                distributionMode, newVotingModel, reservationLimitPolicy,
                reservationFixedDaysPerMonth, extraordinaryExpenseThreshold
        );
    }

    /** Copia con otra restricción de reservas; los días fijos van si y solo si es FIXED_DAYS_PER_MONTH. */
    public GroupSettings withReservationLimit(ReservationLimitPolicy newPolicy, Integer newFixedDaysPerMonth) {
        return new GroupSettings(
                distributionMode, votingModel, newPolicy, newFixedDaysPerMonth, extraordinaryExpenseThreshold
        );
    }

    /** Copia con otro monto a partir del cual un gasto es extraordinario. */
    public GroupSettings withExtraordinaryExpenseThreshold(BigDecimal newThreshold) {
        return new GroupSettings(
                distributionMode, votingModel, reservationLimitPolicy, reservationFixedDaysPerMonth, newThreshold
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
