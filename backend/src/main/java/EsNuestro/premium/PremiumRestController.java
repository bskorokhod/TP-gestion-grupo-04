package EsNuestro.premium;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.premium.dtos.PremiumEligibilityDTO;
import EsNuestro.premium.dtos.PremiumNoticeDTO;
import EsNuestro.premium.dtos.PremiumStatusDTO;
import EsNuestro.premium.dtos.PremiumSubscribeDTO;
import EsNuestro.premium.dtos.PremiumSubscriptionDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/premium")
@Tag(name = "6 - Premium")
class PremiumRestController {

    private final PremiumService premiumService;

    @Autowired
    PremiumRestController(PremiumService premiumService) {
        this.premiumService = premiumService;
    }

    @GetMapping(produces = "application/json")
    @Operation(summary = "Estado del plan premium del grupo (nunca tuvo, en prueba, activo, cancelado pero vigente o terminado), con fechas, pagador y precio; cualquier miembro activo puede consultarlo")
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro activo", content = @Content)
    PremiumStatusDTO status(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return premiumService.status(groupId, principal.email());
    }

    @PostMapping(produces = "application/json")
    @Operation(summary = "Contratar, mejorar o reactivar el plan premium del grupo con los datos de pago (simulado); cualquier miembro activo puede hacerlo. Otorga la prueba gratuita si al usuario y al grupo les corresponde; en prueba, la corta y cobra en el acto; cancelado pero vigente, no cobra hasta la próxima renovación")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "400", description = "Datos de tarjeta inválidos o tarjeta vencida", content = @Content)
    @ApiResponse(responseCode = "402", description = "La tarjeta fue rechazada; no cambia nada", content = @Content)
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro activo", content = @Content)
    @ApiResponse(responseCode = "409", description = "El grupo ya tiene un plan premium pago activo", content = @Content)
    PremiumSubscriptionDTO subscribe(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody PremiumSubscribeDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return premiumService.subscribe(groupId, data, principal.email());
    }

    @GetMapping(value = "/eligibility", produces = "application/json")
    @Operation(summary = "Indica si al caller le corresponde la prueba gratuita al suscribir el grupo (una por usuario y una por grupo); es false si el grupo ya es premium. Solo orienta al formulario: la decisión final se toma al suscribir")
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro activo", content = @Content)
    PremiumEligibilityDTO eligibility(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return premiumService.eligibility(groupId, principal.email());
    }

    @DeleteMapping(produces = "application/json")
    @Operation(summary = "Cancelar el plan premium del grupo; cualquier miembro activo puede hacerlo. Una prueba termina en el acto y no se puede reactivar; un plan pago deja de renovarse y sigue vigente hasta el fin del período pagado, sin reembolso")
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro activo", content = @Content)
    @ApiResponse(responseCode = "409", description = "El grupo no es premium o el plan ya está cancelado", content = @Content)
    PremiumSubscriptionDTO cancel(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return premiumService.cancel(groupId, principal.email());
    }

    @GetMapping(value = "/notices", produces = "application/json")
    @Operation(summary = "Avisos sobre el plan premium que el caller todavía no vio (cancelaciones, mejoras, fin de prueba, débito fallido), sin los que provocó él. Solo lectura: se marcan como vistos con POST /notices/seen")
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro activo", content = @Content)
    List<PremiumNoticeDTO> notices(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return premiumService.pendingNotices(groupId, principal.email());
    }

    @PostMapping("/notices/seen")
    @Operation(summary = "Marcar como vistos los avisos premium del grupo hasta este momento")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro activo", content = @Content)
    void markNoticesSeen(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        premiumService.markNoticesSeen(groupId, principal.email());
    }
}
