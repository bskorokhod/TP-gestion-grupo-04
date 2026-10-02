package EsNuestro.group.dtos;

import EsNuestro.group.DistributionMode;
import EsNuestro.group.GroupSettings;
import EsNuestro.group.ReservationLimitPolicy;
import EsNuestro.group.VotingModel;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Configuración del grupo: se envía completa al crearlo y se devuelve en {@code GroupDTO}.
 * {@code reservationFixedDaysPerMonth} solo se envía (y es obligatorio) con la política
 * FIXED_DAYS_PER_MONTH. Las reglas de coherencia entre campos son métodos {@code @AssertTrue} (y no
 * una restricción de clase) para que el error llegue como error de campo, que es lo que lee el
 * handler global; devuelven true si falta algún campo, porque ya lo reporta {@code @NotNull}.
 */
public record GroupSettingsDTO(
        @NotNull(message = "El modo de repartición del bien es obligatorio")
        DistributionMode distributionMode,
        @NotNull(message = "El modelo de aprobación de votaciones es obligatorio")
        VotingModel votingModel,
        @NotNull(message = "La restricción de reservas es obligatoria")
        ReservationLimitPolicy reservationLimitPolicy,
        Integer reservationFixedDaysPerMonth,
        @NotNull(message = "El monto extraordinario es obligatorio")
        @DecimalMin(value = "0.01", message = "El monto extraordinario debe ser mayor a 0")
        @Digits(integer = 10, fraction = 2, message = "El monto extraordinario admite hasta 10 enteros y 2 decimales")
        BigDecimal extraordinaryExpenseThreshold
) {

    public static GroupSettingsDTO from(GroupSettings settings) {
        return new GroupSettingsDTO(
                settings.getDistributionMode(),
                settings.getVotingModel(),
                settings.getReservationLimitPolicy(),
                settings.getReservationFixedDaysPerMonth(),
                settings.getExtraordinaryExpenseThreshold()
        );
    }

    public GroupSettings toEntity() {
        return new GroupSettings(
                distributionMode,
                votingModel,
                reservationLimitPolicy,
                reservationFixedDaysPerMonth,
                extraordinaryExpenseThreshold
        );
    }

    @JsonIgnore
    @AssertTrue(message = "El modelo de votación elegido requiere reparto porcentual del bien")
    public boolean isVotingModelCompatibleWithDistribution() {
        return distributionMode == null || votingModel == null
                || GroupSettings.isVotingModelAllowed(distributionMode, votingModel);
    }

    @JsonIgnore
    @AssertTrue(message = "La restricción de reservas elegida requiere reparto porcentual del bien")
    public boolean isReservationPolicyCompatibleWithDistribution() {
        return distributionMode == null || reservationLimitPolicy == null
                || GroupSettings.isReservationPolicyAllowed(distributionMode, reservationLimitPolicy);
    }

    @JsonIgnore
    @AssertTrue(message = "Los días fijos por mes (entre 1 y 31) son obligatorios solo con la restricción de cantidad fija")
    public boolean isFixedDaysConsistentWithPolicy() {
        return reservationLimitPolicy == null
                || GroupSettings.isFixedDaysConsistent(reservationLimitPolicy, reservationFixedDaysPerMonth);
    }
}
