package EsNuestro.premium.dtos;

/**
 * Si al caller le corresponde la prueba gratuita al suscribir este grupo. Es una foto del momento: el backend vuelve a
 * decidirlo al suscribir, así que puede cambiar entre la consulta y el envío (por ejemplo si el usuario usa su prueba
 * en otro grupo). Es false si el grupo ya es premium, porque no hay nada que ofrecer.
 */
public record PremiumEligibilityDTO(boolean trialAvailable) {
}
