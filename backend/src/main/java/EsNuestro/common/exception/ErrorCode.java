package EsNuestro.common.exception;

/**
 * Códigos estables de errores de negocio conocidos. El cliente los usa para decidir qué mostrar sin depender del texto
 * del {@code message}. Se serializan como {@code code} en el cuerpo de error; el nombre es el valor.
 */
public enum ErrorCode {
    /** Ya es ACTIVE en el grupo o tiene una solicitud PENDING. */
    ALREADY_MEMBER_OR_PENDING,
    /** El porcentaje pedido para ingresar es inválido o no se puede asignar. No revela cuánto hay disponible. */
    JOIN_PERCENTAGE_NOT_AVAILABLE,
    /** Grupo porcentual y la solicitud no trae porcentaje. */
    JOIN_PERCENTAGE_REQUIRED,
    /** La solicitud de ingreso ya no está PENDING. */
    JOIN_REQUEST_NOT_PENDING,
    /** El caller no es un miembro ACTIVE del grupo. */
    NOT_ACTIVE_MEMBER,
    /** El apodo pedido no se puede usar en el grupo. */
    NICKNAME_NOT_AVAILABLE,
    /** El miembro tiene deudas propias sin saldar y no puede abandonar. */
    DEBTS_UNSETTLED,
    /** El grupo está detenido (los porcentajes de los activos no suman 100%). */
    GROUP_STOPPED
}
