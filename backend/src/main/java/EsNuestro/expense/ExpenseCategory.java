package EsNuestro.expense;

/**
 * Categoría de un gasto, de un conjunto predeterminado. Se guarda por nombre en {@link ExpenseDetails}, así que
 * renombrar un valor rompe los datos existentes; agregar uno nuevo no (ver {@code LegacySchemaMigration}, que elimina
 * el check que Hibernate crea para el enum y que {@code ddl-auto=update} no sabe actualizar).
 * <p>
 * El frontend replica estos valores en {@code models/Expense.ts} y les pone etiqueta y color.
 */
public enum ExpenseCategory {
    SERVICIOS,
    MANTENIMIENTO,
    COMPRAS,
    IMPUESTOS,
    LIMPIEZA,
    /** Categoría por defecto: la que se asigna cuando el gasto no informa ninguna. */
    SIN_CATEGORIA;

    public static final ExpenseCategory DEFAULT = SIN_CATEGORIA;

    /** {@code category}, o la categoría por defecto si es null. */
    public static ExpenseCategory orDefault(ExpenseCategory category) {
        return category == null ? DEFAULT : category;
    }
}
