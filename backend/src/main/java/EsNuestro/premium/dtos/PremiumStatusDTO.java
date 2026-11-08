package EsNuestro.premium.dtos;

import EsNuestro.premium.PremiumState;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Estado del plan premium de un grupo para cualquier miembro activo. {@code trialAvailable} es si al caller le
 * corresponde la prueba al suscribir (siempre false si el grupo ya es premium). Las fechas y el pagador solo vienen
 * cuando aplican: {@code trialEndsAt} y {@code trialDaysLeft} durante la prueba, {@code nextBillingAt} si se va a
 * cobrar, {@code endsAt} si está cancelado pero vigente. {@code youArePayer} dice si quien consulta contrató el plan.
 * <p>
 * {@code payerNickname} es el apodo del pagador en el grupo (lo ven todos los miembros). {@code daysLeft} son los días
 * completos que faltan para el próximo cobro (en prueba o plan activo) o para que termine el premium (cancelado pero
 * vigente); 0 significa que falta menos de un día.
 * <p>
 * Datos privados: {@code cardLast4} y {@code cardholderName} solo vienen para el pagador y solo mientras el plan está
 * activo (la tarjeta ya no se va a cobrar si está cancelado); para cualquier otro miembro son siempre null.
 */
public record PremiumStatusDTO(
        PremiumState state,
        boolean premium,
        boolean trialAvailable,
        Instant trialEndsAt,
        Integer trialDaysLeft,
        Instant nextBillingAt,
        Instant endsAt,
        String payerName,
        String payerNickname,
        boolean youArePayer,
        String cardLast4,
        String cardholderName,
        Integer daysLeft,
        BigDecimal monthlyPrice,
        int trialDays
) {
}
