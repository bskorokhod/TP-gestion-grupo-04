package EsNuestro.group;

import EsNuestro.member.GroupMember;

/**
 * Se publica, dentro de la transacción de {@code GroupService}, cuando un miembro pasa a estar activo en el
 * grupo (se aprobó su solicitud de ingreso). Permite que otros módulos (votaciones) reaccionen sin que
 * {@code group} dependa de ellos.
 */
public record MemberJoinedEvent(Long groupId, GroupMember member) {
}
