package EsNuestro.expense;

import EsNuestro.expense.SpendingCalculator.Entry;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class SpendingCalculatorTest {

    private static final ZoneId BUENOS_AIRES = ZoneId.of("America/Argentina/Buenos_Aires");

    private static Entry entry(String instant, ExpenseCategory category, String amount) {
        return new Entry(Instant.parse(instant), category, new BigDecimal(amount));
    }

    private static void assertAmount(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), "esperaba " + expected + " y fue " + actual);
    }

    @Test
    void byCategorySumsEachCategoryAndOmitsTheEmptyOnes() {
        Map<ExpenseCategory, BigDecimal> totals = SpendingCalculator.byCategory(List.of(
                entry("2026-10-05T12:00:00Z", ExpenseCategory.SERVICIOS, "100.50"),
                entry("2026-10-09T12:00:00Z", ExpenseCategory.SERVICIOS, "20.00"),
                entry("2026-10-10T12:00:00Z", ExpenseCategory.LIMPIEZA, "5.00")
        ));

        assertAmount("120.50", totals.get(ExpenseCategory.SERVICIOS));
        assertAmount("5.00", totals.get(ExpenseCategory.LIMPIEZA));
        assertFalse(totals.containsKey(ExpenseCategory.COMPRAS));
    }

    @Test
    void byMonthAlwaysReturnsTwelveMonthsStartingInJanuary() {
        BigDecimal[] totals = SpendingCalculator.byMonth(List.of(
                entry("2026-01-15T12:00:00Z", ExpenseCategory.COMPRAS, "10.00"),
                entry("2026-03-15T12:00:00Z", ExpenseCategory.COMPRAS, "30.00"),
                entry("2026-03-20T12:00:00Z", ExpenseCategory.IMPUESTOS, "5.00")
        ), ZoneOffset.UTC);

        assertEquals(12, totals.length);
        assertAmount("10.00", totals[0]);
        assertAmount("0", totals[1]);
        assertAmount("35.00", totals[2]);
    }

    /** 31/10 a las 22:00 en Buenos Aires (UTC-3) ya es 1/11 en UTC: el mes depende de la zona. */
    @Test
    void byMonthUsesTheGivenZoneAndNotUtc() {
        List<Entry> entries = List.of(entry("2026-11-01T01:00:00Z", ExpenseCategory.SERVICIOS, "40.00"));

        BigDecimal[] inBuenosAires = SpendingCalculator.byMonth(entries, BUENOS_AIRES);
        BigDecimal[] inUtc = SpendingCalculator.byMonth(entries, ZoneOffset.UTC);

        assertAmount("40.00", inBuenosAires[9]);
        assertAmount("0", inBuenosAires[10]);
        assertAmount("40.00", inUtc[10]);
    }
}
