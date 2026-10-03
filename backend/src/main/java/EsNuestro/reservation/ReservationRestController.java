package EsNuestro.reservation;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.reservation.dtos.CancellationRequestCreateDTO;
import EsNuestro.reservation.dtos.CancellationRequestDTO;
import EsNuestro.reservation.dtos.ReservationCreateDTO;
import EsNuestro.reservation.dtos.ReservationDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}")
@Tag(name = "5 - Reservations")
class ReservationRestController {

    private final ReservationService reservationService;

    ReservationRestController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping(value = "/reservations", produces = "application/json")
    @Operation(summary = "Listar las reservas del grupo")
    List<ReservationDTO> listReservations(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return reservationService.listReservations(groupId, principal.email());
    }

    @PostMapping(value = "/reservations", produces = "application/json")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear una reserva desde mañana")
    @ApiResponse(responseCode = "409", description = "Las fechas no están disponibles", content = {})
    ReservationDTO createReservation(
            @PathVariable Long groupId,
            @Valid @RequestBody ReservationCreateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return reservationService.createReservation(groupId, data, principal.email());
    }

    @DeleteMapping("/reservations/{reservationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cancelar una reserva propia")
    void cancelReservation(
            @PathVariable Long groupId,
            @PathVariable Long reservationId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        reservationService.cancelOwnReservation(groupId, reservationId, principal.email());
    }

    @PostMapping(value = "/reservations/{reservationId}/cancellation-requests", produces = "application/json")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Solicitar la cancelación de una reserva ajena")
    CancellationRequestDTO requestCancellation(
            @PathVariable Long groupId,
            @PathVariable Long reservationId,
            @Valid @RequestBody CancellationRequestCreateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return reservationService.requestCancellation(groupId, reservationId, data, principal.email());
    }

    @GetMapping(value = "/reservation-cancellation-requests", produces = "application/json")
    @Operation(summary = "Listar solicitudes de cancelación para futuras votaciones")
    List<CancellationRequestDTO> listCancellationRequests(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return reservationService.listCancellationRequests(groupId, principal.email());
    }
}
