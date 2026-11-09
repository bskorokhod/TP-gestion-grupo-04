package EsNuestro.group.dtos;

import EsNuestro.group.DistributionMode;
import EsNuestro.group.Group;

/**
 * Vista pública previa a unirse, para quien todavía no es miembro. Expone solo el modo de repartición, para que el
 * cliente sepa si pedir un porcentaje. Por privacidad no expone nada que identifique al grupo (nombre, descripción,
 * miembros), ni su estado, ni cuánto porcentaje queda disponible.
 */
public record GroupPreviewDTO(DistributionMode distributionMode) {
    public static GroupPreviewDTO from(Group group) {
        return new GroupPreviewDTO(group.getSettings().getDistributionMode());
    }
}
