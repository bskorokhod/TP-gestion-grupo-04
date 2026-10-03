package EsNuestro.vote;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.expense.dtos.ExpenseDataDTO;
import EsNuestro.vote.dtos.BallotDataDTO;
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
