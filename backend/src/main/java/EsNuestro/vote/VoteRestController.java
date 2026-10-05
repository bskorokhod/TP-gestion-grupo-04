package EsNuestro.vote;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.expense.dtos.ExpenseDataDTO;
import EsNuestro.vote.dtos.BallotDataDTO;
import EsNuestro.vote.dtos.ConfigChangeDTO;
import EsNuestro.vote.dtos.VoteDTO;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/votes")
@Tag(name = "5 - Votes")
class VoteRestController {

    private final VoteService voteService;

    @Autowired
    VoteRestController(VoteService voteService) {
        this.voteService = voteService;
    }

    @GetMapping(produces = "application/json")
    @Operation(summary = "Listar las votaciones activas visibles para el caller (las finalizadas no se listan)")
    List<VoteDTO> list(
            @PathVariable Long groupId,
            @RequestParam(required = false) VoteType type,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return voteService.listActiveVotes(groupId, principal.email(), type);
    }

    @PostMapping(value = "/extraordinary-expense", produces = "application/json")
    @Operation(summary = "Proponer un gasto extraordinario (que alcanza el umbral del grupo); se crea solo si la votación es positiva")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "404", description = "Grupo o miembro no encontrado", content = @Content)
    @ApiResponse(responseCode = "409", description = "El gasto no alcanza el umbral, o participante/acreedor inactivo, porcentajes inválidos o reparto imposible", content = @Content)
    VoteDTO createExtraordinaryExpense(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody ExpenseDataDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return voteService.createExtraordinaryExpenseVote(groupId, data, principal.email());
    }

    @PostMapping(value = "/config-change", produces = "application/json")
    @Operation(summary = "Proponer el cambio de una configuración del grupo; requiere unanimidad de los miembros activos y se aplica solo si la votación es positiva")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "404", description = "Grupo o miembro no encontrado", content = @Content)
    @ApiResponse(responseCode = "409", description = "El valor propuesto ya es el vigente, dejaría la configuración incoherente o ya hay una votación activa sobre esa configuración", content = @Content)
    VoteDTO createConfigChange(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody ConfigChangeDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return voteService.createConfigChangeVote(groupId, data, principal.email());
    }

    @PostMapping(value = "/expenses/{expenseId}/edit", produces = "application/json")
    @Operation(summary = "Proponer la modificación de un gasto aprobado (reporte); se aplica solo si la votación es positiva. Bloquea el gasto mientras dure")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "404", description = "Grupo o gasto no encontrado, o el caller no participa del gasto", content = @Content)
    @ApiResponse(responseCode = "409", description = "El gasto no está aprobado, ya tiene un reporte en curso, la propuesta no cambia nada, o un participante está inactivo / el reparto es imposible", content = @Content)
    VoteDTO proposeExpenseEdit(
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @Valid @NonNull @RequestBody ExpenseDataDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return voteService.createExpenseEditVote(groupId, expenseId, data, principal.email());
    }

    @PostMapping(value = "/expenses/{expenseId}/deletion", produces = "application/json")
    @Operation(summary = "Proponer la eliminación de un gasto aprobado (reporte); se elimina lógicamente solo si la votación es positiva. Bloquea el gasto mientras dure")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "404", description = "Grupo o gasto no encontrado, o el caller no participa del gasto", content = @Content)
    @ApiResponse(responseCode = "409", description = "El gasto no está aprobado o ya tiene un reporte en curso", content = @Content)
    VoteDTO proposeExpenseDeletion(
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return voteService.createExpenseDeletionVote(groupId, expenseId, principal.email());
    }

    @PutMapping(value = "/{voteId}/ballot", produces = "application/json")
    @Operation(summary = "Emitir o cambiar el voto del caller; si el resultado queda determinado, la votación se finaliza y se ejecuta")
    @ApiResponse(responseCode = "403", description = "El caller no es uno de los miembros involucrados", content = @Content)
    @ApiResponse(responseCode = "404", description = "Grupo o votación no encontrados", content = @Content)
    @ApiResponse(responseCode = "409", description = "La votación ya finalizó", content = @Content)
    VoteDTO castBallot(
            @PathVariable Long groupId,
            @PathVariable Long voteId,
            @Valid @NonNull @RequestBody BallotDataDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return voteService.castBallot(groupId, voteId, data.choice(), principal.email());
    }
}
