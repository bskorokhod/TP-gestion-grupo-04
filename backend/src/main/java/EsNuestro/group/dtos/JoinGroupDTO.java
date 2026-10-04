package EsNuestro.group.dtos;

import EsNuestro.group.Group;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record JoinGroupDTO(
        @NotBlank @Pattern(regexp = Group.JOIN_CODE_REGEX) String joinCode,
        @NotBlank @Size(max = 30) String nickname,
        // Porcentaje de propiedad que pide el solicitante: obligatorio en modo porcentual, ignorado en equitativo.
        // Se valida en el servicio para devolver los mensajes de negocio sin el prefijo de bean validation.
        BigDecimal percentage
) {
}