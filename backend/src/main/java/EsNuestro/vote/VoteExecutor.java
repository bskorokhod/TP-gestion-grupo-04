package EsNuestro.vote;

import java.util.Optional;

/**
 * Acción que se ejecuta cuando una votación de cierto tipo resulta positiva. Si la votación es negativa
 * no se ejecuta nada. Un tipo sin ejecutor registrado no puede aprobarse (hoy, los tipos sin implementar).
 */
interface VoteExecutor {

    VoteType type();

    /**
     * Ejecuta la acción. No debe lanzar excepciones por condiciones esperadas (una excepción que cruza un
     * límite transaccional deja la transacción de la votación marcada para rollback): si la acción ya no
     * puede ejecutarse devuelve el motivo, y la votación queda con resultado EXECUTION_FAILED.
     *
     * @return vacío si se ejecutó; el motivo si no se pudo.
     */
    Optional<String> execute(Vote vote);

    /**
     * Se invoca cuando la votación resulta negativa, justo antes de finalizarla. Por defecto no hace nada.
     */
    default void onRejected(Vote vote) {
    }
}
