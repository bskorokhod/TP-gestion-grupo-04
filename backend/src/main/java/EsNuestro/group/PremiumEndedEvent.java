package EsNuestro.group;

/**
 * El grupo dejó de ser premium (se terminó el período pagado, se canceló la prueba o falló el débito). Lo publica
 * {@code PremiumService} dentro de su transacción, que ya tiene el lock del grupo; {@code VoteService} cierra las
 * votaciones de configuración exclusivas de premium que seguían abiertas, sin aplicar el cambio.
 */
public record PremiumEndedEvent(Long groupId) {
}
