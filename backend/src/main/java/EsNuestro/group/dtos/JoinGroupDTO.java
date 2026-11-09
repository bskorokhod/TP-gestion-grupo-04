package EsNuestro.group.dtos;

import EsNuestro.group.Group;
import EsNuestro.member.GroupMember;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record JoinGroupDTO(
        @NotBlank @Pattern(regexp = Group.JOIN_CODE_REGEX) String joinCode,
        @NotBlank @Size(max = 30) String nickname,
        // Opcional: CVU o alias para recibir pagos. Vacío o null = sin cargar.
        @Pattern(regexp = GroupMember.CVU_REGEX) String cvu,
        // Porcentaje de propiedad que pide el solicitante: obligatorio en modo porcentual, ignorado en equitativo.
        // Se valida en el servicio para devolver los mensajes de negocio sin el prefijo de bean validation.
        BigDecimal percentage
) {
}