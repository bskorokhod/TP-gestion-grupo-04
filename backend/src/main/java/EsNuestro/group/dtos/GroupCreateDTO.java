package EsNuestro.group.dtos;

import EsNuestro.member.GroupMember;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record GroupCreateDTO(
        @NotBlank @Size(max = 30) String name,
        @NotBlank @Size(max = 500) String description,
        // Optional: defaults to the founder's email when left blank.
        @Size(max = 30) String founderNickname,
        // Opcional: CVU de 22 dígitos o alias de 6 a 20 caracteres; vacío = sin cargar.
        @Pattern(regexp = GroupMember.CVU_REGEX) String founderCvu,
        // Porcentaje de propiedad del fundador: obligatorio en modo porcentual (lo valida el servicio), ignorado en equitativo.
        BigDecimal founderPercentage,
        // Obligatoria: el grupo no se crea sin elegir todas sus configuraciones.
        @NotNull(message = "La configuración del grupo es obligatoria") @Valid GroupSettingsDTO settings
) {
}