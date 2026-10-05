package EsNuestro.expense;

import EsNuestro.group.Group;
import EsNuestro.member.GroupMember;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Gasto de un grupo. Guarda los datos vigentes ({@link #details}) y, cuando una edición de un
 * gasto aprobado espera revisión, los datos propuestos ({@link #pendingDetails}); en ese caso las
 * deudas originales quedan suspendidas, no borradas, para que rechazar la edición las restaure
 * exactamente. Las transiciones son cambios de estado puros: las precondiciones (estado, permisos,
 * miembros activos) las valida {@code ExpenseService}.
 * <p>
 * Las deudas siempre se concilian con lo ya pagado (ver {@link DebtReconciliation}): modificar o cancelar un gasto
 * con pagos no los pierde; si alguien pagó de más, queda una devolución a su favor.
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

    /**
     * Hay una votación de reporte (modificar o eliminar este gasto) en curso. Mientras dure no se puede pagar ninguna
     * deuda de este gasto ni modificarlo, eliminarlo o reportarlo de nuevo. La pone la votación al abrirse y la saca
     * al finalizar. Es un {@code Boolean} nullable en la base para no romper gastos anteriores a este campo.
     */
    @Column(name = "report_in_progress")
    private Boolean reportInProgress = false;

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
     * Aprueba el gasto (o su edición pendiente) y concilia las deudas con los datos vigentes.
     */
    public void approve(GroupMember resolver) {
        if (pendingDetails != null) {
            details = pendingDetails;
            pendingDetails = null;
        }
        status = ExpenseStatus.APPROVED;
        recordResolution(resolver, ReviewOutcome.APPROVED);
        reconcileDebts(currentShares());
    }

    /**
     * Rechaza el gasto. Si era la edición de un gasto aprobado, descarta la edición y restaura
     * el gasto y sus deudas originales.
     * TODO(admin): revisar que hoy no se puede alcanzar (ver {@link ExpenseStatus#PENDING_APPROVAL}).
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

    /**
     * Edición de un gasto aprobado: queda pendiente y sus deudas se suspenden.
     * TODO(admin): revisar que hoy no se puede alcanzar: las ediciones directas usan {@link #applyEdit} y no hay
     *  nadie que apruebe o rechace una edición pendiente. Candidato a eliminarse junto con el resto de este flujo.
     */
    public void proposeEdit(ExpenseDetails newDetails) {
        pendingDetails = newDetails;
        debts.forEach(Debt::suspend);
        status = ExpenseStatus.PENDING_APPROVAL;
    }

    /**
     * Reenvío de un gasto rechazado, con cambios ({@code changes} != null) o sin ellos.
     * TODO(admin): revisar que hoy no se puede alcanzar (ver {@link ExpenseStatus#PENDING_APPROVAL}).
     */
    public void resubmit(ExpenseDetails changes) {
        if (changes != null) {
            details = changes;
        }
        status = ExpenseStatus.PENDING_APPROVAL;
    }

    /**
     * Aplica una modificación a un gasto aprobado (directa del creador sin pagos, o aprobada por votación): reemplaza
     * los datos vigentes y concilia las deudas con lo ya pagado. Quien pagó de más queda con una devolución a favor.
     */
    public void applyEdit(ExpenseDetails newDetails) {
        details = newDetails;
        reconcileDebts(currentShares());
    }

    /**
     * Eliminación lógica: el gasto queda cancelado, con todas sus partes en cero. Quien ya había pagado queda con
     * una devolución a favor por todo lo que pagó.
     */
    public void cancel() {
        pendingDetails = null;
        status = ExpenseStatus.CANCELLED;
        reconcileDebts(Map.of());
    }

    public void lockForReport() {
        this.reportInProgress = true;
    }

    public void unlockReport() {
        this.reportInProgress = false;
    }

    public boolean isReportInProgress() {
        return Boolean.TRUE.equals(reportInProgress);
    }

    public ExpenseDetails detailsUnderReview() {
        return pendingDetails != null ? pendingDetails : details;
    }

    public boolean isCreatedBy(GroupMember member) {
        return creator.getId().equals(member.getId());
    }

    /**
     * Creador, acreedor o deudor (también de la edición pendiente) o parte de alguna deuda, por ejemplo quien tiene una
     * devolución a favor aunque ya no figure como participante.
     */
    public boolean isInvolved(GroupMember member) {
        return isCreatedBy(member)
                || details.involves(member)
                || (pendingDetails != null && pendingDetails.involves(member))
                || debts.stream().anyMatch(debt ->
                debt.getDebtor().getId().equals(member.getId()) || debt.getCreditor().getId().equals(member.getId()));
    }

    public boolean hasPayments() {
        return debts.stream().anyMatch(Debt::hasPayments);
    }

    private void recordResolution(GroupMember resolver, ReviewOutcome outcome) {
        this.lastResolvedBy = resolver;
        this.lastOutcome = outcome;
        this.lastResolvedAt = Instant.now();
    }

    /**
     * La parte de cada deudor según los datos vigentes (id de miembro -> importe). Quien no debe nada (el acreedor,
     * o quien tiene parte en cero) no figura; sin participantes el acreedor cubre todo y no hay partes.
     */
    private Map<Long, BigDecimal> currentShares() {
        Map<Long, BigDecimal> shares = new LinkedHashMap<>();
        if (details.getParticipants().isEmpty()) {
            return shares;
        }
        Long creditorId = details.getCreditor().getId();
        ExpenseSplitCalculator.split(details.getTotalAmount(), details.getSplitMethod(), details.splitParticipants())
                .forEach((memberId, share) -> {
                    if (!memberId.equals(creditorId) && share.signum() > 0) {
                        shares.put(memberId, share);
                    }
                });
        return shares;
    }

    /**
     * Deja las deudas coherentes con las partes nuevas ({@code shares}) y con lo ya pagado: por cada miembro
     * actualiza su parte y su devolución según {@link DebtReconciliation}. Una deuda sin pagos y sin saldo se elimina;
     * una con pagos se conserva aunque quede en cero, para no perder el historial.
     */
    private void reconcileDebts(Map<Long, BigDecimal> shares) {
        Map<Long, GroupMember> membersById = new LinkedHashMap<>();
        Map<Long, Debt> shareDebts = new LinkedHashMap<>();
        Map<Long, Debt> refundDebts = new LinkedHashMap<>();

        details.getParticipants().forEach(p -> membersById.put(p.getMember().getId(), p.getMember()));
        for (Debt debt : debts) {
            if (debt.isRefund()) {
                membersById.putIfAbsent(debt.getRefundTo().getId(), debt.getRefundTo());
                refundDebts.put(debt.getRefundTo().getId(), debt);
            } else {
                membersById.putIfAbsent(debt.getDebtor().getId(), debt.getDebtor());
                shareDebts.put(debt.getDebtor().getId(), debt);
            }
        }

        Set<Long> memberIds = new LinkedHashSet<>(shares.keySet());
        memberIds.addAll(shareDebts.keySet());
        memberIds.addAll(refundDebts.keySet());

        for (Long memberId : memberIds) {
            BigDecimal share = shares.getOrDefault(memberId, BigDecimal.ZERO);
            Debt shareDebt = shareDebts.get(memberId);
            Debt refundDebt = refundDebts.get(memberId);

            BigDecimal paid = shareDebt == null ? BigDecimal.ZERO : shareDebt.paymentsTotal();
            BigDecimal refunded = refundDebt == null ? BigDecimal.ZERO : refundDebt.getPaidAmount();
            DebtReconciliation.Outcome outcome = DebtReconciliation.reconcile(share, paid, refunded);

            if (shareDebt != null) {
                if (share.signum() == 0 && !shareDebt.hasPayments()) {
                    debts.remove(shareDebt);
                } else {
                    shareDebt.reconcileTo(share, outcome.appliedToShare());
                }
            } else if (share.signum() > 0) {
                debts.add(Debt.of(this, membersById.get(memberId), share));
            }

            if (refundDebt != null) {
                if (outcome.refundAmount().signum() == 0 && !refundDebt.hasPayments()) {
                    debts.remove(refundDebt);
                } else {
                    refundDebt.reconcileTo(outcome.refundAmount(), refundDebt.getPaidAmount());
                }
            } else if (outcome.refundAmount().signum() > 0) {
                debts.add(Debt.refund(this, details.getCreditor(), membersById.get(memberId), outcome.refundAmount()));
            }
        }
    }
}
