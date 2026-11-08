package EsNuestro.premium.dtos;

import EsNuestro.premium.PremiumState;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Estado del plan premium de un grupo para cualquier miembro activo. {@code trialAvailable} es si al caller le
 * corresponde la prueba al suscribir (siempre false si el grupo ya es premium). Las fechas y el pagador solo vienen
 * cuando aplican: {@code trialEndsAt} y {@code trialDaysLeft} durante la prueba, {@code nextBillingAt} si se va a
 * cobrar, {@code endsAt} si está cancelado pero vigente. {@code youArePayer} dice si quien consulta contrató el plan.
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
        boolean youArePayer,
        String cardLast4,
        BigDecimal monthlyPrice,
        int trialDays
) {
}
