/** Tooltip de las acciones bloqueadas mientras el grupo está detenido (status STOPPED). */
export const GROUP_STOPPED_EXPENSE_TITLE =
    "El grupo está detenido: no se pueden crear gastos hasta que los porcentajes sumen 100%";
export const GROUP_STOPPED_VOTE_TITLE =
    "El grupo está detenido: no se puede votar hasta que los porcentajes sumen 100%";

/** "Falta asignar X% para llegar al 100%": lo que falta cuando los porcentajes de los activos no suman 100. */
export const missingPercentageText = (missing: number): string => `Falta asignar ${missing}% para llegar al 100%`;

/** Qué implica que el grupo esté detenido; va después de explicar cuánto porcentaje falta. */
export const GROUP_STOPPED_CONSEQUENCE = "Mientras tanto no se pueden crear gastos, votar ni reservar días.";
