package EsNuestro.expense;

import EsNuestro.group.Group;
import EsNuestro.member.GroupMember;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Gasto de un grupo. Guarda los datos vigentes ({@link #details}) y, cuando una edición de un
 * gasto aprobado espera revisión, los datos propuestos ({@link #pendingDetails}); en ese caso las
 * deudas originales quedan suspendidas, no borradas, para que rechazar la edición las restaure
 * exactamente. Las transiciones son cambios de estado puros: las precondiciones (estado, permisos,
 * miembros activos) las valida {@code ExpenseService}.
 */
@Entity
@Table(name = "expenses")
@NoArgsConstructor
@Getter
public class Expense {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    /** Miembro que registró el gasto; no tiene por qué ser acreedor ni deudor. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private GroupMember creator;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ExpenseStatus status;

    @OneToOne(optional = false, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "details_id", nullable = false)
    private ExpenseDetails details;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "pending_details_id")
    private ExpenseDetails pendingDetails;

    @ManyToOne
    @JoinColumn(name = "last_resolved_by_id")
    private GroupMember lastResolvedBy;

    @Enumerated(EnumType.STRING)
    private ReviewOutcome lastOutcome;

    private Instant lastResolvedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Debt> debts = new ArrayList<>();

    private Expense(GroupMember creator, ExpenseDetails details) {
        this.group = creator.getGroup();
        this.creator = creator;
        this.details = details;
        this.status = ExpenseStatus.PENDING_APPROVAL;
        this.createdAt = Instant.now();
    }

    /** Nace pendiente y sin deudas; si lo registra un admin, el servicio lo aprueba de inmediato. */
    public static Expense register(GroupMember creator, ExpenseDetails details) {
        return new Expense(creator, details);
    }

    /**
     * Aprueba el gasto (o su edición pendiente) y genera las deudas a partir de los datos vigentes,
     * reemplazando las anteriores si las hubiera.
     */
    public void approve(GroupMember resolver) {
        if (pendingDetails != null) {
            details = pendingDetails;
            pendingDetails = null;
        }
        status = ExpenseStatus.APPROVED;
        recordResolution(resolver, ReviewOutcome.APPROVED);
        regenerateDebts();
    }

    /**
     * Rechaza el gasto. Si era la edición de un gasto aprobado, descarta la edición y restaura
     * el gasto y sus deudas originales.
     */
    public void reject(GroupMember resolver) {
        if (pendingDetails != null) {
            pendingDetails = null;
            debts.forEach(Debt::reactivate);
            status = ExpenseStatus.APPROVED;
        } else {
            status = ExpenseStatus.REJECTED;
        }
        recordResolution(resolver, ReviewOutcome.REJECTED);
    }

    /** Edición de un gasto aprobado: queda pendiente y sus deudas se suspenden. */
    public void proposeEdit(ExpenseDetails newDetails) {
        pendingDetails = newDetails;
        debts.forEach(Debt::suspend);
        status = ExpenseStatus.PENDING_APPROVAL;
    }

    /** Reenvío de un gasto rechazado, con cambios ({@code changes} != null) o sin ellos. */
    public void resubmit(ExpenseDetails changes) {
        if (changes != null) {
            details = changes;
        }
        status = ExpenseStatus.PENDING_APPROVAL;
    }

    public ExpenseDetails detailsUnderReview() {
        return pendingDetails != null ? pendingDetails : details;
    }

    public boolean isCreatedBy(GroupMember member) {
        return creator.getId().equals(member.getId());
    }

    /** Creador, acreedor o deudor (también de la edición pendiente); no depende de que existan deudas. */
    public boolean isInvolved(GroupMember member) {
        return isCreatedBy(member)
                || details.involves(member)
                || (pendingDetails != null && pendingDetails.involves(member));
    }

    public boolean hasPayments() {
        return debts.stream().anyMatch(Debt::hasPayments);
    }

    private void recordResolution(GroupMember resolver, ReviewOutcome outcome) {
        this.lastResolvedBy = resolver;
        this.lastOutcome = outcome;
        this.lastResolvedAt = Instant.now();
    }

    private void regenerateDebts() {
        debts.clear();
        Long creditorId = details.getCreditor().getId();
        Map<Long, GroupMember> participantsById = details.getParticipants().stream()
                .map(ExpenseParticipant::getMember)
                .collect(Collectors.toMap(GroupMember::getId, Function.identity()));

        ExpenseSplitCalculator.split(details.getTotalAmount(), details.getSplitMethod(), details.getParticipants())
                .forEach((memberId, share) -> {
                    boolean owesNothing = memberId.equals(creditorId) || share.signum() == 0;
                    if (!owesNothing) {
                        debts.add(Debt.of(this, participantsById.get(memberId), share));
                    }
                });
    }
}
