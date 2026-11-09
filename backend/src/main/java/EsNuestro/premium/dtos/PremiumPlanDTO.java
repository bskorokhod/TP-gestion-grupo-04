package EsNuestro.premium.dtos;

import java.math.BigDecimal;

/**
 * Oferta del plan premium: precio mensual (sin impuestos) y días de la prueba gratuita. No depende de ningún grupo ni
 * usuario, así que se puede consultar sin sesión.
 */
public record PremiumPlanDTO(BigDecimal monthlyPrice, int trialDays) {
}
