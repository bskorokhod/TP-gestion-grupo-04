package EsNuestro.group;

/**
 * Se publica, dentro de la transacción de {@code GroupService}, cuando un miembro deja de estar activo
 * en el grupo. Permite que otros módulos (votaciones) reaccionen sin que {@code group} dependa de ellos.
 */
public record MemberLeftEvent(Long groupId, Long memberId) {
}
