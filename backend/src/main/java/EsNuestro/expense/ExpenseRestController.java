package EsNuestro.expense;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.expense.dtos.ExpenseDTO;
import EsNuestro.expense.dtos.ExpenseDataDTO;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/expenses")
@Tag(name = "4 - Expenses")
class ExpenseRestController {

    private final ExpenseService expenseService;

    @Autowired
    ExpenseRestController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping(produces = "application/json")
    @Operation(summary = "Registrar un gasto; queda aprobado si lo registra un admin y pendiente de aprobación si no")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "404", description = "Grupo o miembro no encontrado", content = @Content)
    @ApiResponse(responseCode = "409", description = "Participante o acreedor inactivo, porcentajes inválidos o reparto imposible", content = @Content)
    ExpenseDTO create(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody ExpenseDataDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return expenseService.createExpense(groupId, data, principal.username());
    }

    @GetMapping(produces = "application/json")
    @Operation(summary = "Listar los gastos visibles para el caller: los propios o en los que está involucrado; los admins ven todos")
    List<ExpenseDTO> list(
            @PathVariable Long groupId,
            @RequestParam(required = false) ExpenseStatus status,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return expenseService.listExpenses(groupId, principal.username(), status);
    }

    @GetMapping(value = "/{expenseId}", produces = "application/json")
    @Operation(summary = "Obtener un gasto (solo involucrados y admins)")
    @ApiResponse(responseCode = "403", description = "El caller no está involucrado en el gasto", content = @Content)
    @ApiResponse(responseCode = "404", description = "Gasto no encontrado", content = @Content)
    ExpenseDTO get(
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return expenseService.getExpense(groupId, expenseId, principal.username());
    }

    @PutMapping(value = "/{expenseId}", produces = "application/json")
    @Operation(summary = "Editar un gasto aprobado sin pagos (creador o admin); si edita un admin se aplica directo, si no queda pendiente de aprobación")
    @ApiResponse(responseCode = "403", description = "Solo el creador o un admin pueden editar", content = @Content)
    @ApiResponse(responseCode = "409", description = "El gasto no está aprobado o tiene pagos", content = @Content)
    ExpenseDTO update(
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @Valid @NonNull @RequestBody ExpenseDataDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return expenseService.updateExpense(groupId, expenseId, data, principal.username());
    }

    @PostMapping(value = "/{expenseId}/approve", produces = "application/json")
    @Operation(summary = "Aprobar un gasto pendiente (o su edición) y generar las deudas (solo admin)")
    @ApiResponse(responseCode = "403", description = "Solo un admin puede aprobar", content = @Content)
    @ApiResponse(responseCode = "409", description = "El gasto ya fue resuelto (indica por quién y con qué resultado) o un participante ya no está activo", content = @Content)
    ExpenseDTO approve(
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return expenseService.approveExpense(groupId, expenseId, principal.username());
    }

    @PostMapping(value = "/{expenseId}/reject", produces = "application/json")
    @Operation(summary = "Rechazar un gasto pendiente; si era una edición, se restaura el gasto y sus deudas originales (solo admin)")
    @ApiResponse(responseCode = "403", description = "Solo un admin puede rechazar", content = @Content)
    @ApiResponse(responseCode = "409", description = "El gasto ya fue resuelto (indica por quién y con qué resultado)", content = @Content)
    ExpenseDTO reject(
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return expenseService.rejectExpense(groupId, expenseId, principal.username());
    }

    @PostMapping(value = "/{expenseId}/resubmit", produces = "application/json")
    @Operation(summary = "Reenviar un gasto rechazado, con cambios (body) o sin ellos; si lo reenvía un admin queda aprobado directo")
    @ApiResponse(responseCode = "403", description = "Solo el creador o un admin pueden reenviar", content = @Content)
    @ApiResponse(responseCode = "409", description = "El gasto no está rechazado", content = @Content)
    ExpenseDTO resubmit(
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @Valid @RequestBody(required = false) ExpenseDataDTO changes,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return expenseService.resubmitExpense(groupId, expenseId, changes, principal.username());
    }

    @DeleteMapping("/{expenseId}")
    @Operation(summary = "Eliminar un gasto y sus deudas (creador o admin); bloqueado si alguna deuda tiene pagos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(responseCode = "403", description = "Solo el creador o un admin pueden eliminar", content = @Content)
    @ApiResponse(responseCode = "409", description = "Alguna deuda del gasto tiene pagos", content = @Content)
    void delete(
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        expenseService.deleteExpense(groupId, expenseId, principal.username());
    }
}
