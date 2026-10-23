package EsNuestro.expense;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Agregaciones del balance sobre una lista ya filtrada de gastos saldados. No sabe qué es un gasto ni de quién se
 * calcula: recibe cada uno como un {@link Entry} con el monto que hay que sumar (el total del gasto para el grupo, la
 * parte del miembro para el balance personal).
 */
final class SpendingCalculator {

    private SpendingCalculator() {
    }

    record Entry(Instant createdAt, ExpenseCategory category, BigDecimal amount) {
    }

    /** Suma por categoría; solo figuran las categorías que tienen al menos una entrada. */
    static Map<ExpenseCategory, BigDecimal> byCategory(List<Entry> entries) {
        Map<ExpenseCategory, BigDecimal> totals = new EnumMap<>(ExpenseCategory.class);
        for (Entry entry : entries) {
            totals.merge(entry.category(), entry.amount(), BigDecimal::add);
        }
        return totals;
    }

    /**
     * Suma por mes calendario en {@code zone}: siempre 12 posiciones, la 0 es enero. Las entradas deben ser de un único
     * año de esa zona. El mes se mide en la zona del usuario y no en UTC: un gasto del 31/10 a las 22:00 en Buenos Aires
     * ya es 1/11 en UTC.
     */
    static BigDecimal[] byMonth(List<Entry> entries, ZoneId zone) {
        BigDecimal[] totals = new BigDecimal[12];
        Arrays.fill(totals, BigDecimal.ZERO);
        for (Entry entry : entries) {
            int index = entry.createdAt().atZone(zone).getMonthValue() - 1;
            totals[index] = totals[index].add(entry.amount());
        }
        return totals;
    }
}
