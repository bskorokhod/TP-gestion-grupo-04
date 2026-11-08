package EsNuestro.premium;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.group.dtos.GroupDTO;
import EsNuestro.premium.dtos.PremiumEligibilityDTO;
import EsNuestro.premium.dtos.PremiumGroupCreateDTO;
import EsNuestro.premium.dtos.PremiumPlanDTO;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Premium antes de que el grupo exista: crear un grupo premium de entrada y saber si al usuario le toca la prueba. */
@RestController
@RequestMapping("/groups/premium")
@Tag(name = "6 - Premium")
class PremiumGroupCreationRestController {

    private final PremiumService premiumService;

    @Autowired
    PremiumGroupCreationRestController(PremiumService premiumService) {
        this.premiumService = premiumService;
    }

    @GetMapping(value = "/eligibility", produces = "application/json")
    @Operation(summary = "Indica si al caller le corresponde la prueba gratuita al crear un grupo premium (una por usuario); el grupo es nuevo, así que solo cuenta si el usuario ya usó la suya")
    PremiumEligibilityDTO eligibility(@AuthenticationPrincipal JwtUserDetails principal) {
        return premiumService.eligibilityForNewGroup(principal.email());
    }

    @GetMapping(value = "/plan", produces = "application/json")
    @Operation(summary = "Oferta del plan premium (precio mensual y días de prueba). Es público: no depende de ningún grupo ni usuario")
    PremiumPlanDTO plan() {
        return premiumService.plan();
    }

    @PostMapping(produces = "application/json")
    @Operation(summary = "Crear un grupo premium: el grupo, con cualquier configuración, y su suscripción en un solo paso. Si el pago es rechazado no se crea nada")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "400", description = "Datos del grupo o de la tarjeta inválidos, o tarjeta vencida", content = @Content)
    @ApiResponse(responseCode = "402", description = "La tarjeta fue rechazada; el grupo no se crea", content = @Content)
    GroupDTO create(
            @Valid @NonNull @RequestBody PremiumGroupCreateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return premiumService.createPremiumGroup(data, principal.email());
    }
}
