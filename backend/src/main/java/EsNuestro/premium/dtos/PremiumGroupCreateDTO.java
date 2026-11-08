package EsNuestro.premium.dtos;

import EsNuestro.group.dtos.GroupCreateDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * Alta de un grupo premium: los datos del grupo (con cualquier configuración) y los de pago. Se crean juntos o no se
 * crea nada: si el pago es rechazado, el grupo no existe.
 */
public record PremiumGroupCreateDTO(
        @NotNull @Valid GroupCreateDTO group,
        @NotNull @Valid PremiumSubscribeDTO payment
) {
}
