package EsNuestro.member;

/**
 * Por qué un miembro ACTIVE pasó a DEACTIVATED, para que finalizeExits()
 * sepa si el destino final es LEFT o REMOVED.
 */
enum GroupMemberExitReason {
    LEAVING,
    REMOVED
}