package EsNuestro.premium;

/**
 * Hechos de la vida del plan premium que se avisan a los miembros del grupo la próxima vez que entran (como toasts).
 * El frontend arma el mensaje a partir del tipo y de los datos de {@link PremiumNotice}.
 */
public enum PremiumNoticeType {
    /** Un miembro empezó la prueba gratuita del grupo. */
    TRIAL_STARTED,

    /** Un miembro activó el plan premium pago (sin prueba). */
    PLAN_ACTIVATED,

    /** Un miembro mejoró el plan: cortó la prueba en curso y empezó el premium pago en el acto. */
    PLAN_UPGRADED,

    /** Un miembro reactivó un plan cancelado que seguía vigente; la tarjeta nueva se cobra desde la próxima renovación. */
    PLAN_REACTIVATED,

    /** Un miembro canceló la prueba: terminó en el acto y no se puede volver a activar. */
    TRIAL_CANCELLED,

    /** Un miembro canceló el plan pago: no se renueva y sigue vigente hasta el fin del período pagado. */
    PLAN_CANCELLED,

    /** Faltan pocos días para que termine la prueba; se debitará a nombre del pagador. */
    TRIAL_ENDING,

    /** Terminó la prueba y se debitó el primer mes. */
    TRIAL_CONVERTED,

    /** El débito falló: el grupo volvió al plan gratuito. */
    PAYMENT_FAILED,

    /** Terminó el período pagado de un plan cancelado: el grupo volvió al plan gratuito. */
    PLAN_ENDED
}
