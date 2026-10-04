package EsNuestro.member.dtos;

import java.math.BigDecimal;

/**
 * Nuevo porcentaje propio. Sin anotaciones de validación a propósito: el servicio valida el rango y los
 * decimales para devolver los mensajes de negocio tal cual, sin el prefijo de los errores de bean validation.
 */
public record PercentageUpdateDTO(BigDecimal percentage) {
}
