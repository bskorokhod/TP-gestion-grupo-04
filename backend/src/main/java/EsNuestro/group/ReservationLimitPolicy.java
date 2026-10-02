package EsNuestro.group;

/**
 * Restricción de reservas: cantidad máxima de días por mes que un miembro puede reservar el bien.
 * <p>
 * Todavía no se aplica en ningún flujo: hoy solo se persiste.
 */
public enum ReservationLimitPolicy {
    /**
     * Equitativo: todos los miembros activos tienen el mismo tope, es decir, los días del mes
     * divididos por la cantidad de miembros activos.
     */
    EQUAL(false),

    /**
     * Proporcional al porcentaje de propiedad: el tope de cada miembro son los días del mes
     * multiplicados por su porcentaje de propiedad / 100. Requiere {@link DistributionMode#PERCENTAGE}.
     */
    OWNERSHIP_PROPORTIONAL(true),

    /**
     * Cantidad fija: todos los miembros pueden reservar como máximo
     * {@code GroupSettings.reservationFixedDaysPerMonth} días por mes. Es el único caso en que ese
     * campo es obligatorio.
     */
    FIXED_DAYS_PER_MONTH(false);

    private final boolean dependsOnOwnership;

    ReservationLimitPolicy(boolean dependsOnOwnership) {
        this.dependsOnOwnership = dependsOnOwnership;
    }

    /** Si esta política necesita que el porcentaje de propiedad de cada miembro tenga significado. */
    public boolean dependsOnOwnership() {
        return dependsOnOwnership;
    }
}
