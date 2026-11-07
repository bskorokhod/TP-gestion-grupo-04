package EsNuestro.premium;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/groups/{groupId}/premium")
@Tag(name = "6 - Premium")
class PremiumRestController {

    private final PremiumService premiumService;

    @Autowired
    PremiumRestController(PremiumService premiumService) {
        this.premiumService = premiumService;
    }

    @PostMapping(produces = "application/json")
    @Operation(summary = "Suscribir el grupo al plan premium con los datos de pago (simulado, sin cobro real); cualquier miembro activo puede hacerlo. Otorga la prueba gratuita si al usuario le corresponde")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "400", description = "Datos de tarjeta inválidos o tarjeta vencida", content = @Content)
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro activo", content = @Content)
    @ApiResponse(responseCode = "409", description = "El grupo ya es premium", content = @Content)
    PremiumSubscriptionDTO subscribe(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody PremiumSubscribeDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return premiumService.subscribe(groupId, data, principal.email());
    }
}
