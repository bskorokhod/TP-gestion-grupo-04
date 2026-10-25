package EsNuestro.expense;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.expense.dtos.CategoryBreakdownDTO;
import EsNuestro.expense.dtos.MonthlySpendingDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/expenses/balance")
@Tag(name = "4 - Expenses")
class SpendingRestController {

    private final SpendingService spendingService;

    @Autowired
    SpendingRestController(SpendingService spendingService) {
        this.spendingService = spendingService;
    }

    @GetMapping(value = "/categories", produces = "application/json")
    @Operation(summary = "Balance de un mes: total y monto por categoría de los gastos saldados, del grupo (GROUP) o lo que le toca al caller (ME)")
    @ApiResponse(responseCode = "400", description = "Año, mes o zona horaria inválidos", content = @Content)
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro", content = @Content)
    CategoryBreakdownDTO byCategory(
            @PathVariable Long groupId,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(defaultValue = "GROUP") SpendingScope scope,
            @RequestParam(required = false) String zone,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return spendingService.byCategory(groupId, year, month, scope, zone, principal.email());
    }

    @GetMapping(value = "/monthly", produces = "application/json")
    @Operation(summary = "Balance de un año: total de gastos saldados de cada uno de los 12 meses, del grupo (GROUP) o lo que le toca al caller (ME)")
    @ApiResponse(responseCode = "400", description = "Año o zona horaria inválidos", content = @Content)
    @ApiResponse(responseCode = "404", description = "Grupo no encontrado o el caller no es miembro", content = @Content)
    List<MonthlySpendingDTO> monthly(
            @PathVariable Long groupId,
            @RequestParam int year,
            @RequestParam(defaultValue = "GROUP") SpendingScope scope,
            @RequestParam(required = false) String zone,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return spendingService.monthly(groupId, year, scope, zone, principal.email());
    }
}
