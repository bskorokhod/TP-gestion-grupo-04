package EsNuestro.group;

/**
 * Modo de repartición del bien entre los miembros del grupo. Se elige al crear el grupo y condiciona
 * qué otras configuraciones tienen sentido (ver {@link #hasOwnershipPercentages()}).
 */
public enum DistributionMode {
    /**
     * Todos los miembros activos tienen la misma parte del bien. El porcentaje de propiedad
     * ({@code group_members.percentage}) no es un concepto de negocio en este modo, así que las
     * opciones que dependen de él no pueden elegirse (ver {@link VotingModel#dependsOnOwnership()}
     * y {@link ReservationLimitPolicy#dependsOnOwnership()}).
     * <p>
     * Pendiente a futuro: decidir qué hacer con los endpoints de edición de porcentajes
     * ({@code PUT /groups/{id}/members/percentages}) en un grupo EQUAL.
     */
    EQUAL,

    /**
     * Cada miembro tiene un porcentaje de propiedad propio (el que ya se administra en
     * {@code group_members.percentage}, que debe sumar 100 entre los miembros que lo detentan).
     */
    PERCENTAGE;

    /** Si en este modo el porcentaje de propiedad de cada miembro tiene significado. */
    public boolean hasOwnershipPercentages() {
        return this == PERCENTAGE;
    }
}
