package EsNuestro.expense;

import EsNuestro.member.GroupMember;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Datos editables de un gasto. Un {@link Expense} tiene siempre unos datos vigentes y, mientras
 * una edición de un gasto aprobado espera revisión, unos datos propuestos. Las instancias son
 * inmutables una vez creadas: editar un gasto crea unos {@code ExpenseDetails} nuevos.
 */
@Entity
@Table(name = "expense_details")
@NoArgsConstructor
@Getter
public class ExpenseDetails {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 200)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SplitMethod splitMethod;

    /** Quien pagó el gasto y a quien se le debe; puede ser distinto de quien lo registró. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "creditor_id", nullable = false)
    private GroupMember creditor;

    /** URL desde la que el frontend accede al comprobante (ticket/factura). */
    @Column(nullable = false, length = 2048)
    private String receiptUrl;

    /** Miembros entre los que se reparte el gasto; puede no haber ninguno (lo cubre el acreedor). */
    @ElementCollection
    @CollectionTable(name = "expense_participants", joinColumns = @JoinColumn(name = "details_id"))
    private List<ExpenseParticipant> participants = new ArrayList<>();

    public ExpenseDetails(
            String title, String description, BigDecimal totalAmount, SplitMethod splitMethod,
            GroupMember creditor, String receiptUrl, List<ExpenseParticipant> participants
    ) {
        this.title = title;
        this.description = description;
        this.totalAmount = totalAmount;
        this.splitMethod = splitMethod;
        this.creditor = creditor;
        this.receiptUrl = receiptUrl;
        this.participants = new ArrayList<>(participants);
    }

    public boolean involves(GroupMember member) {
        return creditor.getId().equals(member.getId())
                || participants.stream().anyMatch(participant -> participant.getMember().getId().equals(member.getId()));
    }

    /**
     * Participantes sobre los que se calcula el reparto: en EQUAL y PROPORTIONAL se suma el
     * acreedor (su parte se descarta después, al generar las deudas, pero primero tiene que entrar
     * en el denominador). En CUSTOM se devuelven los participantes tal cual: los porcentajes ya son
     * explícitos y suman 100 entre ellos, sin una porción implícita para el acreedor.
     */
    List<ExpenseParticipant> splitParticipants() {
        if (splitMethod == SplitMethod.CUSTOM) {
            return participants;
        }
        List<ExpenseParticipant> withCreditor = new ArrayList<>(participants);
        withCreditor.add(new ExpenseParticipant(creditor, null));
        return withCreditor;
    }
}
