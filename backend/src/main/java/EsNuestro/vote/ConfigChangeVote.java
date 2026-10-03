package EsNuestro.vote;

import EsNuestro.group.DistributionMode;
import EsNuestro.group.Group;
import EsNuestro.group.GroupSettings;
import EsNuestro.group.ReservationLimitPolicy;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Se vota si cambiar una configuración del grupo. Siempre requiere unanimidad (sin importar el modelo de
 * votación del grupo) y la ven todos los miembros, no solo unos involucrados. Votan todos los miembros
 * activos al momento de proponerla.
 * <p>
 * Cada propuesta cambia una sola configuración ({@link #getSetting()}) y guarda únicamente su valor
 * propuesto, no una copia de toda la configuración: así dos propuestas sobre configuraciones distintas no
 * se pisan entre sí. Al aprobarse, el valor se aplica sobre la configuración vigente en ese momento (ver
 * {@link #applyTo}); si ya no es coherente con ella, la votación termina en EXECUTION_FAILED.
 */
@Entity
@Table(name = "config_change_votes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class ConfigChangeVote extends Vote {

    @Column(name = "setting", nullable = false)
    @Enumerated(EnumType.STRING)
    private ConfigSetting setting;

    @Enumerated(EnumType.STRING)
    private DistributionMode proposedDistributionMode;

    @Enumerated(EnumType.STRING)
    private VotingModel proposedVotingModel;

    @Enumerated(EnumType.STRING)
    private ReservationLimitPolicy proposedReservationLimitPolicy;

    /** Solo con la política FIXED_DAYS_PER_MONTH; si no, es null. */
    private Integer proposedReservationFixedDaysPerMonth;

    @Column(precision = 12, scale = 2)
    private BigDecimal proposedExtraordinaryExpenseThreshold;

    private ConfigChangeVote(Group group, GroupMember proposer, ConfigSetting setting) {
        super(group, proposer, VoteType.CONFIG_CHANGE, VotingModel.UNANIMOUS);
        this.setting = setting;
    }

    public static ConfigChangeVote ofDistributionMode(Group group, GroupMember proposer, DistributionMode mode) {
        ConfigChangeVote vote = new ConfigChangeVote(group, proposer, ConfigSetting.DISTRIBUTION_MODE);
        vote.proposedDistributionMode = mode;
        return vote;
    }

    public static ConfigChangeVote ofVotingModel(Group group, GroupMember proposer, VotingModel model) {
        ConfigChangeVote vote = new ConfigChangeVote(group, proposer, ConfigSetting.VOTING_MODEL);
        vote.proposedVotingModel = model;
        return vote;
    }

    public static ConfigChangeVote ofReservationLimit(
            Group group, GroupMember proposer, ReservationLimitPolicy policy, Integer fixedDaysPerMonth
    ) {
        ConfigChangeVote vote = new ConfigChangeVote(group, proposer, ConfigSetting.RESERVATION_LIMIT_POLICY);
        vote.proposedReservationLimitPolicy = policy;
        vote.proposedReservationFixedDaysPerMonth = fixedDaysPerMonth;
        return vote;
    }

    public static ConfigChangeVote ofExtraordinaryExpenseThreshold(
            Group group, GroupMember proposer, BigDecimal threshold
    ) {
        ConfigChangeVote vote = new ConfigChangeVote(group, proposer, ConfigSetting.EXTRAORDINARY_EXPENSE_THRESHOLD);
        vote.proposedExtraordinaryExpenseThreshold = threshold;
        return vote;
    }

    /**
     * La configuración resultante de aplicar el valor propuesto sobre {@code current}. Lanza
     * {@link IllegalArgumentException} si la combinación resultante es incoherente.
     */
    public GroupSettings applyTo(GroupSettings current) {
        return switch (setting) {
            case DISTRIBUTION_MODE -> current.withDistributionMode(proposedDistributionMode);
            case VOTING_MODEL -> current.withVotingModel(proposedVotingModel);
            case RESERVATION_LIMIT_POLICY -> current.withReservationLimit(
                    proposedReservationLimitPolicy, proposedReservationFixedDaysPerMonth
            );
            case EXTRAORDINARY_EXPENSE_THRESHOLD ->
                    current.withExtraordinaryExpenseThreshold(proposedExtraordinaryExpenseThreshold);
        };
    }

    /** Si el valor propuesto ya es el vigente (cambiar los días fijos con la misma política sí es un cambio). */
    public boolean changesNothingIn(GroupSettings current) {
        return switch (setting) {
            case DISTRIBUTION_MODE -> current.getDistributionMode() == proposedDistributionMode;
            case VOTING_MODEL -> current.getVotingModel() == proposedVotingModel;
            case RESERVATION_LIMIT_POLICY ->
                    current.getReservationLimitPolicy() == proposedReservationLimitPolicy
                            && Objects.equals(
                                    current.getReservationFixedDaysPerMonth(), proposedReservationFixedDaysPerMonth
                            );
            case EXTRAORDINARY_EXPENSE_THRESHOLD ->
                    current.getExtraordinaryExpenseThreshold().compareTo(proposedExtraordinaryExpenseThreshold) == 0;
        };
    }

    @Override
    public boolean isVisibleTo(GroupMember member) {
        return true;
    }
}
