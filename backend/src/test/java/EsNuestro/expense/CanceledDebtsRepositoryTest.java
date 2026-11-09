package EsNuestro.expense;

import EsNuestro.group.DistributionMode;
import EsNuestro.group.Group;
import EsNuestro.group.GroupSettings;
import EsNuestro.group.ReservationLimitPolicy;
import EsNuestro.group.VotingModel;
import EsNuestro.member.GroupMember;
import EsNuestro.member.MemberColor;
import EsNuestro.user.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Las consultas que tratan a las deudas CANCELED como saldadas o las ignoran. */
@DataJpaTest
class CanceledDebtsRepositoryTest {

    @Autowired
    private EntityManager em;
    @Autowired
    private DebtRepository debtRepository;
    @Autowired
    private ExpenseRepository expenseRepository;

    private Group group;
    private GroupMember a;
    private GroupMember b;

    private GroupMember member(String name, String percentage) {
        User user = new User("pw", "USER", name, "Apellido", name + "@mail.com", null, null);
        em.persist(user);
        GroupMember member = GroupMember.founder(group, user, name, MemberColor.BLUE, new BigDecimal(percentage));
        group.getMembers().add(member);
        return member;
    }

    @BeforeEach
    void setUp() {
        group = new Group("Casa", "Casa", "ABC-1234-XYZ", new GroupSettings(
                DistributionMode.PERCENTAGE, VotingModel.SIMPLE_MAJORITY, ReservationLimitPolicy.EQUAL, null,
                new BigDecimal("1000")));
        em.persist(group);
        a = member("A", "50");
        b = member("B", "50");
        em.flush();
    }

    /** Gasto aprobado de B (acreedor) con A como único participante, que debe 500. */
    private Expense expenseWhereADebtsB() {
        ExpenseDetails details = new ExpenseDetails("Alquiler", null, ExpenseCategory.SIN_CATEGORIA,
                new BigDecimal("500.00"), SplitMethod.EQUAL, b, "https://receipt", List.of(new ExpenseParticipant(a)));
        Expense expense = Expense.register(b, details);
        expense.approve(b);
        em.persist(expense);
        em.flush();
        em.clear();
        return expense;
    }

    private List<Expense> settled() {
        return expenseRepository.findSettledByGroupId(group.getId(), ExpenseStatus.APPROVED);
    }

    @Test
    void anExpenseWithAnUnpaidActiveDebtIsNotSettled() {
        expenseWhereADebtsB();

        assertThat(settled()).isEmpty();
    }

    @Test
    void anExpenseWhoseOnlyUnpaidDebtIsCanceledIsSettledAndCountsInStatistics() {
        Expense expense = expenseWhereADebtsB();
        debtRepository.findById(expense.getDebts().get(0).getId()).orElseThrow().cancel();
        em.flush();
        em.clear();

        assertThat(settled()).hasSize(1);
        assertThat(expenseRepository.findSettledBetween(group.getId(), ExpenseStatus.APPROVED,
                Instant.now().minusSeconds(3600), Instant.now().plusSeconds(3600))).hasSize(1);
    }

    @Test
    void aCanceledDebtDoesNotBlockItsDebtorFromLeaving() {
        Expense expense = expenseWhereADebtsB();
        assertThat(debtRepository.existsUnsettledByDebtorId(a.getId())).isTrue();

        debtRepository.findById(expense.getDebts().get(0).getId()).orElseThrow().cancel();
        em.flush();

        assertThat(debtRepository.existsUnsettledByDebtorId(a.getId())).isFalse();
    }

    @Test
    void collectableDebtsIncludeSuspendedOnesAndExcludeCanceledAndSettledOnes() {
        Expense expense = expenseWhereADebtsB();
        assertThat(debtRepository.findCollectableByGroupId(group.getId())).hasSize(1);

        Debt debt = debtRepository.findById(expense.getDebts().get(0).getId()).orElseThrow();
        ReflectionTestUtils.invokeMethod(debt, "suspend");
        em.flush();
        em.clear();
        assertThat(debtRepository.findCollectableByGroupId(group.getId())).hasSize(1);

        debtRepository.findById(debt.getId()).orElseThrow().cancel();
        em.flush();
        em.clear();
        assertThat(debtRepository.findCollectableByGroupId(group.getId())).isEmpty();
    }
}
