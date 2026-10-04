package EsNuestro.vote;

public enum VoteStatus {
    /** Se muestra a los miembros y admite votos (y cambios de voto). */
    ACTIVE,

    /**
     * Ya tiene resultado y se ejecutó: no se muestra a los miembros, pero se conserva (borrado lógico)
     * para el futuro historial de decisiones.
     */
    FINALIZED
}
