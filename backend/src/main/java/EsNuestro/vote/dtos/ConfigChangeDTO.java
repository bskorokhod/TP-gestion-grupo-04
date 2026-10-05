package EsNuestro.vote.dtos;

import EsNuestro.group.DistributionMode;
import EsNuestro.group.GroupSettings;
import EsNuestro.group.ReservationLimitPolicy;
import EsNuestro.group.VotingModel;
import EsNuestro.vote.ConfigChangeVote;
import EsNuestro.vote.ConfigSetting;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Cambio propuesto a una configuración del grupo: sirve de cuerpo al proponerlo y de vista dentro de
 * {@code VoteDTO}. Va {@code setting} (qué configuración cambia) y solo el nuevo valor de esa configuración:
 * {@code distributionMode}, {@code votingModel}, {@code reservationLimitPolicy} (con
 * {@code reservationFixedDaysPerMonth} si y solo si es FIXED_DAYS_PER_MONTH) o
 * {@code extraordinaryExpenseThreshold}. La regla de coherencia es un método {@code @AssertTrue} (y no una
 * restricción de clase) para que el error llegue como error de campo, que es lo que lee el handler global.
 */
public record ConfigChangeDTO(
        @NotNull(message = "La configuración a modificar es obligatoria")
        ConfigSetting setting,
        DistributionMode distributionMode,
        VotingModel votingModel,
        ReservationLimitPolicy reservationLimitPolicy,
        Integer reservationFixedDaysPerMonth,
        @DecimalMin(value = "0.01", message = "El monto extraordinario debe ser mayor a 0")
        @Digits(integer = 10, fraction = 2, message = "El monto extraordinario admite hasta 10 enteros y 2 decimales")
        BigDecimal extraordinaryExpenseThreshold
) {

    public static ConfigChangeDTO from(ConfigChangeVote vote) {
        return new ConfigChangeDTO(
                vote.getSetting(),
                vote.getProposedDistributionMode(),
                vote.getProposedVotingModel(),
                vote.getProposedReservationLimitPolicy(),
                vote.getProposedReservationFixedDaysPerMonth(),
                vote.getProposedExtraordinaryExpenseThreshold()
        );
    }

    @JsonIgnore
    @AssertTrue(message = "Enviá únicamente el nuevo valor de la configuración elegida (los días fijos por mes, "
            + "entre 1 y 31, solo con la restricción de cantidad fija)")
    public boolean isProposedValueConsistent() {
        if (setting == null) {
            return true;
        }
        return switch (setting) {
            case DISTRIBUTION_MODE -> distributionMode != null
                    && votingModel == null && reservationLimitPolicy == null
                    && reservationFixedDaysPerMonth == null && extraordinaryExpenseThreshold == null;
            case VOTING_MODEL -> votingModel != null
                    && distributionMode == null && reservationLimitPolicy == null
                    && reservationFixedDaysPerMonth == null && extraordinaryExpenseThreshold == null;
            case RESERVATION_LIMIT_POLICY -> reservationLimitPolicy != null
                    && GroupSettings.isFixedDaysConsistent(reservationLimitPolicy, reservationFixedDaysPerMonth)
                    && distributionMode == null && votingModel == null && extraordinaryExpenseThreshold == null;
            case EXTRAORDINARY_EXPENSE_THRESHOLD -> extraordinaryExpenseThreshold != null
                    && distributionMode == null && votingModel == null
                    && reservationLimitPolicy == null && reservationFixedDaysPerMonth == null;
        };
    }
}
