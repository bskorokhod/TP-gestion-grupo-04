package EsNuestro.group;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.group.dtos.GroupCreateDTO;
import EsNuestro.group.dtos.GroupDTO;
import EsNuestro.group.dtos.GroupPreviewDTO;
import EsNuestro.group.dtos.JoinGroupDTO;
import EsNuestro.member.dtos.*;
import EsNuestro.member.MembershipStatus;
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
@RequestMapping("/groups")
@Tag(name = "3 - Groups")
class GroupRestController {

    private final GroupService groupService;

    @Autowired
    GroupRestController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping(produces = "application/json")
    @Operation(summary = "Create a new group; the caller becomes its founder")
    @ResponseStatus(HttpStatus.CREATED)
    GroupDTO create(
            @Valid @NonNull @RequestBody GroupCreateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws MethodArgumentNotValidException {
        return groupService.createGroup(data, principal.email());
    }

    @GetMapping(produces = "application/json")
    @Operation(summary = "List the groups the caller actively belongs to")
    List<GroupDTO> listMine(@AuthenticationPrincipal JwtUserDetails principal) {
        return groupService.listMyGroups(principal.email());
    }

    @GetMapping(value = "/{groupId}", produces = "application/json")
    @Operation(summary = "Get a group's details")
    @ApiResponse(responseCode = "404", description = "Group not found", content = @Content)
    GroupDTO get(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.getGroup(groupId, principal.email());
    }

    @GetMapping(value = "/code/{joinCode}", produces = "application/json")
    @Operation(summary = "Obtener un grupo por su código; solo para miembros que pueden verlo")
    @ApiResponse(responseCode = "403", description = "Tuvo relación con el grupo pero ya no puede verlo", content = @Content)
    @ApiResponse(responseCode = "404", description = "No existe un grupo con ese código o el caller no es miembro", content = @Content)
    GroupDTO getByCode(
            @PathVariable String joinCode,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.getGroupByCode(joinCode, principal.email());
    }

    @GetMapping(value = "/join/{joinCode}", produces = "application/json")
    @Operation(summary = "Obtener el nombre de un grupo a partir de su código de unión")
    @ApiResponse(responseCode = "404", description = "No existe un grupo con ese código", content = @Content)
    GroupPreviewDTO previewByJoinCode(@PathVariable String joinCode) throws ItemNotFoundException {
        return groupService.previewGroup(joinCode);
    }

    @PostMapping(value = "/join", produces = "application/json")
    @Operation(summary = "Solicitar unirse a un grupo con su código; queda en estado PENDING")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "404", description = "No existe un grupo con ese código", content = @Content)
    @ApiResponse(responseCode = "409", description = "Ya es miembro, tiene una solicitud pendiente o fue removido", content = @Content)
    JoinRequestDTO requestToJoin(
            @Valid @NonNull @RequestBody JoinGroupDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.requestToJoin(data, principal.email());
    }

    @GetMapping(value = "/join-requests/mine", produces = "application/json")
    @Operation(summary = "Listar las solicitudes de ingreso propias (PENDING y REJECTED)")
    List<JoinRequestDTO> listMyJoinRequests(@AuthenticationPrincipal JwtUserDetails principal) {
        return groupService.listMyJoinRequests(principal.email());
    }

    @GetMapping(value = "/{groupId}/members", produces = "application/json")
    @Operation(summary = "Listar los miembros del grupo; admin y fundador ven también solicitudes y ex miembros")
    @ApiResponse(responseCode = "404", description = "Group not found", content = @Content)
    List<MemberDTO> listMembers(
            @PathVariable Long groupId,
            @RequestParam(required = false) MembershipStatus status,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.listMembers(groupId, principal.email(), status);
    }

    @PostMapping(value = "/{groupId}/members/{memberId}/approve", produces = "application/json")
    @Operation(summary = "Aprobar una solicitud de ingreso; el miembro queda ACTIVE con el porcentaje que pidió")
    @ApiResponse(responseCode = "403", description = "Sin permiso para aprobar solicitudes", content = @Content)
    @ApiResponse(responseCode = "409", description = "La solicitud no está en estado PENDING o su porcentaje ya no entra en el 100%", content = @Content)
    MemberDTO approveJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.approveJoinRequest(groupId, memberId, principal.email());
    }

    @PostMapping(value = "/{groupId}/members/{memberId}/reject", produces = "application/json")
    @Operation(summary = "Rechazar una solicitud de ingreso; el miembro queda REJECTED")
    @ApiResponse(responseCode = "403", description = "Sin permiso para rechazar solicitudes", content = @Content)
    @ApiResponse(responseCode = "409", description = "La solicitud no está en estado PENDING", content = @Content)
    MemberDTO rejectJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.rejectJoinRequest(groupId, memberId, principal.email());
    }

    @DeleteMapping("/{groupId}/members/me")
    @Operation(summary = "Leave the group")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(responseCode = "409", description = "The founder cannot leave the group", content = @Content)
    void leave(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        groupService.leaveGroup(groupId, principal.email());
    }

    @PatchMapping(value = "/{groupId}/members/me/nickname", produces = "application/json")
    @Operation(summary = "Cambiar el apodo propio; el color se reasigna solo si el actual queda en conflicto")
    @ApiResponse(responseCode = "409", description = "El apodo está usado por demasiados miembros del grupo", content = @Content)
    MemberDTO changeMyNickname(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody MemberNicknameUpdateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.changeNickname(groupId, principal.email(), data.nickname());
    }

    @PatchMapping(value = "/{groupId}/members/me/percentage", produces = "application/json")
    @Operation(summary = "Cambiar el porcentaje de propiedad propio (solo modo porcentual); sin aprobación y sin tocar a los demás")
    @ApiResponse(responseCode = "400", description = "Porcentaje nulo, negativo, mayor a 100 o con más de 2 decimales", content = @Content)
    @ApiResponse(responseCode = "409", description = "El grupo es equitativo o la suma de los activos superaría 100%", content = @Content)
    MemberDTO updateMyPercentage(
            @PathVariable Long groupId,
            @NonNull @RequestBody PercentageUpdateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.updateMyPercentage(groupId, data, principal.email());
    }

    @DeleteMapping(value = "/{groupId}/members/percentages", produces = "application/json")
    @Operation(summary = "Confirmar la salida de miembros DEACTIVATED; su porcentaje ya no se computaba desde la baja")
    @ApiResponse(responseCode = "403", description = "Caller lacks permission", content = @Content)
    @ApiResponse(responseCode = "409", description = "Un miembro no está DEACTIVATED", content = @Content)
    List<MemberDTO> finalizeExits(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody FinalizeExitsDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.finalizeExits(groupId, data, principal.email());
    }
}