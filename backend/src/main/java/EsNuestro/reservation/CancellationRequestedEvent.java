package EsNuestro.reservation;

/**
 * Se publica, dentro de la transacción de {@code ReservationService}, cuando un miembro reclama (solicita cancelar)
 * la reserva de otro. Permite que otros módulos (votaciones) abran la votación del reclamo sin que
 * {@code reservation} dependa de ellos.
 */
public record CancellationRequestedEvent(Long groupId, CancellationRequest request) {
}