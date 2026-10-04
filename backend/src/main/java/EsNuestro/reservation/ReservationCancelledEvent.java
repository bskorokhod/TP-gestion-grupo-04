package EsNuestro.reservation;

/**
 * Se publica, dentro de la transacción de {@code ReservationService}, cuando el dueño cancela su propia reserva.
 * Permite que otros módulos (votaciones) cierren los reclamos abiertos sobre ella sin que {@code reservation}
 * dependa de ellos.
 */
public record ReservationCancelledEvent(Long groupId, Long reservationId) {
}