package EsNuestro.expense;

public enum SplitMethod {
    /** Partes iguales entre los participantes; un miembro con 0% de posesión también paga. */
    EQUAL,
    /** Según el porcentaje de posesión de cada participante, normalizado para sumar 100%. */
    PROPORTIONAL;

    /** Si el reparto usa el porcentaje de propiedad de cada miembro, que no existe en un grupo EQUAL. */
    public boolean dependsOnOwnership() {
        return this == PROPORTIONAL;
    }
}
