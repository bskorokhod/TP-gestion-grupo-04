package EsNuestro.group;

/**
 * Estado de funcionamiento del grupo. Se deriva siempre de los miembros activos (ver {@link Group#getStatus()}),
 * nunca se persiste, así que no puede quedar desincronizado.
 */
public enum GroupStatus {
    /** Equitativo con al menos un miembro activo, o porcentual con los activos sumando exactamente 100%. */
    RUNNING,

    /** Porcentual con los activos sumando distinto de 100%, o grupo sin miembros activos. */
    STOPPED
}
