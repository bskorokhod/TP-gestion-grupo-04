package EsNuestro.group;

/**
 * Modo de repartición del bien entre los miembros del grupo. Se elige al crear el grupo y condiciona
 * qué otras configuraciones tienen sentido (ver {@link #hasOwnershipPercentages()}).
 */
public enum DistributionMode {
    /**
     * Todos los miembros activos tienen la misma parte del bien. El porcentaje de cada uno
     * ({@code group_members.percentage}) lo calcula el grupo solo, como 100/N con 2 decimales (los centavos de
     * porcentaje que sobran van a los miembros más antiguos para que sumen exactamente 100), y se recalcula en
     * cada alta, baja o cambio de modo (ver {@link Group#refreshOwnership()}). Los miembros no lo pueden editar.
     * Las opciones que dependen de la propiedad no pueden elegirse (ver {@link VotingModel#dependsOnOwnership()}
     * y {@link ReservationLimitPolicy#dependsOnOwnership()}). Con al menos un miembro activo el grupo está
     * siempre funcionando.
     */
    EQUAL,

    /**
     * Cada miembro define su propio porcentaje ({@code group_members.percentage}). El grupo funciona solo si los
     * miembros activos suman exactamente 100; si suman menos queda detenido, y nunca pueden sumar más.
     */
    PERCENTAGE;

    /** Si en este modo el porcentaje de propiedad de cada miembro tiene significado. */
    public boolean hasOwnershipPercentages() {
        return this == PERCENTAGE;
    }
}
