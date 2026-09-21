package EsNuestro.expense;

public enum SplitMethod {
    /** Partes iguales entre los participantes; un miembro con 0% de posesión también paga. */
    EQUAL,
    /** Según el porcentaje de posesión de cada participante, normalizado para sumar 100%. */
    PROPORTIONAL,
    /** Porcentajes indicados explícitamente para cada participante; deben sumar 100%. */
    CUSTOM
}
