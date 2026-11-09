package EsNuestro.premium;

/** Estado de la {@link PremiumSubscription} de un grupo. Debe coincidir con {@code Group#isPremium}: ACTIVE si y solo si el grupo es premium. */
public enum PremiumSubscriptionStatus {
    ACTIVE,

    /** Cancelada: el grupo dejó de ser premium. La fila se conserva (historial y prueba gratuita ya consumida). */
    CANCELLED
}
