package EsNuestro.expense;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.expense.SpendingCalculator.Entry;
import EsNuestro.expense.dtos.CategoryBreakdownDTO;
import EsNuestro.expense.dtos.CategorySpendingDTO;
import EsNuestro.expense.dtos.MonthlySpendingDTO;
import EsNuestro.group.GroupService;
import EsNuestro.member.GroupMember;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

/**
 * Balance del grupo: cuánto se gastó por mes y por categoría. Solo cuentan los gastos saldados (aprobados y sin deudas
 * pendientes, ver {@link ExpenseRepository#findSettledBetween}), ubicados en el mes de su fecha de creación. Es de solo
 * lectura: solo exige poder ver el grupo, así que sigue disponible con el grupo detenido.
 */
@Service
@Transactional
class SpendingService {

    /** Zona para calcular los meses cuando el cliente no informa la suya. */
    static final ZoneId DEFAULT_ZONE = ZoneId.of("America/Argentina/Buenos_Aires");

    private static final int MIN_YEAR = 2000;
    private static final int MAX_YEAR = 2100;

    private final ExpenseRepository expenseRepository;
    private final GroupService groupService;

    @Autowired
    SpendingService(ExpenseRepository expenseRepository, GroupService groupService) {
        this.expenseRepository = expenseRepository;
        this.groupService = groupService;
    }

    /** Total y desglose por categoría de un mes ({@code month} de 1 a 12). */
    CategoryBreakdownDTO byCategory(
            Long groupId, int year, int month, SpendingScope scope, String zone, String username
    ) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);
        ZoneId zoneId = parseZone(zone);
        requireYear(year);
        YearMonth yearMonth = parseYearMonth(year, month);

        Instant from = yearMonth.atDay(1).atStartOfDay(zoneId).toInstant();
        Instant to = yearMonth.plusMonths(1).atDay(1).atStartOfDay(zoneId).toInstant();
        Map<ExpenseCategory, BigDecimal> totals = SpendingCalculator.byCategory(entries(groupId, caller, scope, from, to));

        List<CategorySpendingDTO> categories = totals.entrySet().stream()
                .filter(entry -> entry.getValue().signum() > 0)
                .map(entry -> new CategorySpendingDTO(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(CategorySpendingDTO::amount).reversed())
                .toList();
        BigDecimal total = categories.stream().map(CategorySpendingDTO::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CategoryBreakdownDTO(total, categories);
    }

    /** Total de cada uno de los 12 meses de un año: los meses sin gastos saldados valen cero. */
    List<MonthlySpendingDTO> monthly(
            Long groupId, int year, SpendingScope scope, String zone, String username
    ) throws ItemNotFoundException {
        GroupMember caller = groupService.requireViewer(groupId, username);
        ZoneId zoneId = parseZone(zone);
        requireYear(year);

        Instant from = LocalDate.of(year, 1, 1).atStartOfDay(zoneId).toInstant();
        Instant to = LocalDate.of(year + 1, 1, 1).atStartOfDay(zoneId).toInstant();
        BigDecimal[] totals = SpendingCalculator.byMonth(entries(groupId, caller, scope, from, to), zoneId);

        return IntStream.range(0, totals.length)
                .mapToObj(index -> new MonthlySpendingDTO(index + 1, totals[index]))
                .toList();
    }

    /** Un {@link Entry} por gasto saldado: su total para el grupo, lo que le toca al caller para el balance personal. */
    private List<Entry> entries(Long groupId, GroupMember caller, SpendingScope scope, Instant from, Instant to) {
        return expenseRepository.findSettledBetween(groupId, ExpenseStatus.APPROVED, from, to).stream()
                .map(expense -> new Entry(
                        expense.getCreatedAt(),
                        expense.getDetails().getCategory(),
                        scope == SpendingScope.ME
                                ? expense.costFor(caller.getId())
                                : expense.getDetails().getTotalAmount()
                ))
                .toList();
    }

    private static ZoneId parseZone(String zone) {
        if (zone == null || zone.isBlank()) {
            return DEFAULT_ZONE;
        }
        try {
            return ZoneId.of(zone.strip());
        } catch (DateTimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Zona horaria inválida: " + zone);
        }
    }

    private static void requireYear(int year) {
        if (year < MIN_YEAR || year > MAX_YEAR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Año fuera de rango: " + year);
        }
    }

    private static YearMonth parseYearMonth(int year, int month) {
        try {
            return YearMonth.of(year, month);
        } catch (DateTimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mes inválido: " + month);
        }
    }
}
