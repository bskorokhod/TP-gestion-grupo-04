package EsNuestro.group;

import EsNuestro.member.GroupMember;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Entity(name = "groups")
@NoArgsConstructor
@Getter
public class Group {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupMember> members = new ArrayList<>();

    public static final String JOIN_CODE_REGEX = "(?i)[A-Z]{3}-[0-9]{4}-[A-Z]{3}";

    public static final BigDecimal TOTAL_PERCENTAGE = BigDecimal.valueOf(100);

    @Column(nullable = false, updatable = false, unique = true, length = 12)
    private String joinCode;

    /** Configuración del grupo; solo cambia por una votación unánime de configuración (ver {@link #changeSettings}). */
    @Embedded
    private GroupSettings settings;

    public Group(String name, String description, String joinCode, GroupSettings settings) {
        this.name = name;
        this.description = description;
        this.joinCode = joinCode;
        this.settings = settings;
        this.createdAt = Instant.now();
    }

    public void addMember(GroupMember member) {
        members.add(member);
    }

    public void changeSettings(GroupSettings newSettings) {
        DistributionMode previousMode = this.settings == null ? null : this.settings.getDistributionMode();
        this.settings = newSettings;
        if (previousMode != newSettings.getDistributionMode()) {
            refreshOwnership();
        }
    }

    public List<GroupMember> activeMembers() {
        return members.stream().filter(GroupMember::isActive).toList();
    }

    /** Suma de los porcentajes de los miembros activos; los pendientes e inactivos no cuentan. */
    public BigDecimal assignedPercentage() {
        return activeMembers().stream()
                .map(GroupMember::getPercentage)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Cuánto falta para llegar a 100%; nunca es negativo porque la suma no puede superar 100%. */
    public BigDecimal missingPercentage() {
        return TOTAL_PERCENTAGE.subtract(assignedPercentage()).max(BigDecimal.ZERO);
    }

    public GroupStatus getStatus() {
        if (activeMembers().isEmpty()) {
            return GroupStatus.STOPPED;
        }
        if (!settings.getDistributionMode().hasOwnershipPercentages()) {
            return GroupStatus.RUNNING;
        }
        return assignedPercentage().compareTo(TOTAL_PERCENTAGE) == 0 ? GroupStatus.RUNNING : GroupStatus.STOPPED;
    }

    public boolean isStopped() {
        return getStatus() == GroupStatus.STOPPED;
    }

    /**
     * Reajusta los porcentajes tras un cambio en los miembros activos (alta, baja) o en el modo de repartición.
     * En modo equitativo reparte en partes iguales; en modo porcentual solo fija 100% si queda un único activo.
     */
    public void refreshOwnership() {
        if (settings.getDistributionMode().hasOwnershipPercentages()) {
            fixSoleMemberPercentage();
        } else {
            redistributeEqually();
        }
    }

    /**
     * Reparte 100% entre los activos con 2 decimales. Los centavos de porcentaje que sobran de la división
     * (p. ej. 100/3) van a los miembros más antiguos, para que la suma sea exactamente 100.
     */
    void redistributeEqually() {
        List<GroupMember> active = activeMembers().stream()
                .sorted(Comparator
                        .comparing(GroupMember::getJoinedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(GroupMember::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        if (active.isEmpty()) {
            return;
        }

        BigDecimal count = BigDecimal.valueOf(active.size());
        BigDecimal base = TOTAL_PERCENTAGE.divide(count, 2, RoundingMode.DOWN);
        int extraHundredths = TOTAL_PERCENTAGE.subtract(base.multiply(count)).movePointRight(2).intValueExact();
        BigDecimal hundredth = new BigDecimal("0.01");

        for (int i = 0; i < active.size(); i++) {
            active.get(i).updatePercentage(i < extraHundredths ? base.add(hundredth) : base);
        }
    }

    void fixSoleMemberPercentage() {
        List<GroupMember> active = activeMembers();
        if (active.size() == 1) {
            active.getFirst().updatePercentage(TOTAL_PERCENTAGE);
        }
    }
}
