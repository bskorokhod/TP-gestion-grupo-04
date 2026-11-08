package EsNuestro.premium;

/** En qué punto del plan premium está un grupo; define qué muestra el navbar y qué ofrece el dashboard. */
public enum PremiumState {
    /** Nunca tuvo premium ni prueba: se ofrece probarlo. */
    NEVER,

    /** En prueba gratuita. */
    TRIAL,

    /** Premium pago y activo (se renueva cada mes). */
    ACTIVE,

    /** Cancelado pero todavía vigente hasta el fin del período pagado: sigue siendo premium, sin renovación. */
    CANCELLED_IN_FORCE,

    /** Tuvo premium (o prueba) y ya no lo tiene: se ofrece potenciar el grupo. */
    EXPIRED
}
