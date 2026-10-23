package EsNuestro.expense;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class ExpenseDetailsCategoryTest {

    private static ExpenseDetails details(ExpenseCategory category) {
        // El acreedor no se usa en estos casos: no hace falta armar un miembro.
        return new ExpenseDetails(
                "Techo", null, category, new BigDecimal("100.00"), SplitMethod.EQUAL, null, "https://receipt", List.of()
        );
    }

    @Test
    void withoutCategoryItDefaultsToSinCategoria() {
        assertEquals(ExpenseCategory.SIN_CATEGORIA, details(null).getCategory());
    }

    @Test
    void anExplicitCategoryIsKept() {
        assertEquals(ExpenseCategory.LIMPIEZA, details(ExpenseCategory.LIMPIEZA).getCategory());
    }

    @Test
    void copyKeepsTheCategory() {
        assertEquals(ExpenseCategory.IMPUESTOS, details(ExpenseCategory.IMPUESTOS).copy().getCategory());
    }

    /** Si la categoría no entrara en la comparación, una votación que solo la cambia se rechazaría por "sin cambios". */
    @Test
    void aDifferentCategoryIsNotTheSameContent() {
        assertFalse(details(ExpenseCategory.SERVICIOS).sameContentAs(details(ExpenseCategory.COMPRAS)));
    }
}
