package EsNuestro.group;

/**
 * Modelo de aprobación de votaciones del grupo. En todos los casos, "a favor" se cuenta sobre los
 * miembros involucrados en el gasto sometido a votación (acreedor y participantes), no sobre todos
 * los miembros del grupo.
 * <p>
 * Se aplica en {@code EsNuestro.vote.VoteTally}: una votación se cierra apenas su resultado queda determinado,
 * y un empate exacto es un rechazo. Los cambios de configuración fuerzan UNANIMOUS sin importar este valor.
 */
public enum VotingModel {
    /**
     * Mayoría simple: se aprueba si más de la mitad de los miembros involucrados vota a favor
     * (un miembro, un voto, sin importar su porcentaje de propiedad).
     */
    SIMPLE_MAJORITY(false),

    /**
     * Mayoría ponderada por propiedad: se aprueba si la suma de los porcentajes de propiedad de
     * quienes votan a favor supera el 50% de la suma de los porcentajes de los miembros involucrados.
     * Un miembro con 0% (p. ej. recién aprobado) no tiene peso. Requiere
     * {@link DistributionMode#PERCENTAGE}.
     */
    OWNERSHIP_WEIGHTED_MAJORITY(true),

    /** Unánime: se aprueba solo si todos los miembros involucrados votan a favor. */
    UNANIMOUS(false);

    private final boolean dependsOnOwnership;

    VotingModel(boolean dependsOnOwnership) {
        this.dependsOnOwnership = dependsOnOwnership;
    }

    /** Si este modelo necesita que el porcentaje de propiedad de cada miembro tenga significado. */
    public boolean dependsOnOwnership() {
        return dependsOnOwnership;
    }
}
