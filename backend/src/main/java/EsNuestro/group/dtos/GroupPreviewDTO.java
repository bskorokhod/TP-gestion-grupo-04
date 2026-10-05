package EsNuestro.group.dtos;

import EsNuestro.group.DistributionMode;
import EsNuestro.group.Group;

/**
 * Vista pública previa a unirse. Expone el modo de repartición para que el cliente sepa si pedir un porcentaje;
 * no expone el estado del grupo ni cuánto porcentaje queda disponible.
 */
public record GroupPreviewDTO(String name, DistributionMode distributionMode) {
    public static GroupPreviewDTO from(Group group) {
        return new GroupPreviewDTO(group.getName(), group.getSettings().getDistributionMode());
    }
}
