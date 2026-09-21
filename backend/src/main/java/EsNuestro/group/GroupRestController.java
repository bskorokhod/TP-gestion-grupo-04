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
    @Operation(summary = "Aprobar una solicitud de ingreso; el miembro queda ACTIVE con 0% (solo fundador/admin)")
    @ApiResponse(responseCode = "403", description = "Sin permiso para aprobar solicitudes", content = @Content)
    @ApiResponse(responseCode = "409", description = "La solicitud no está en estado PENDING", content = @Content)
    MemberDTO approveJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.approveJoinRequest(groupId, memberId, principal.email());
    }

    @PostMapping(value = "/{groupId}/members/{memberId}/reject", produces = "application/json")
    @Operation(summary = "Rechazar una solicitud de ingreso; el miembro queda REJECTED (solo fundador/admin)")
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

    @DeleteMapping("/{groupId}/members/{memberId}")
    @Operation(summary = "Remove a member from the group (founder/admin only)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(responseCode = "403", description = "Caller lacks permission to remove this member", content = @Content)
    void removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        groupService.removeMember(groupId, memberId, principal.email());
    }

    @PatchMapping(value = "/{groupId}/members/{memberId}/role", produces = "application/json")
    @Operation(summary = "Change a member's role (founder only)")
    @ApiResponse(responseCode = "403", description = "Only the founder can change roles", content = @Content)
    MemberDTO changeRole(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @Valid @NonNull @RequestBody MemberRoleUpdateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.changeRole(groupId, memberId, data.role(), principal.email());
    }

    @PutMapping(value = "/{groupId}/members/percentages", produces = "application/json")
    @Operation(summary = "Ajustar porcentajes de miembros ACTIVE; el total del grupo debe quedar en exactamente 100 (solo fundador/admin)")
    @ApiResponse(responseCode = "403", description = "Caller lacks permission", content = @Content)
    @ApiResponse(responseCode = "409", description = "El total no suma 100 o hay miembros no activos", content = @Content)
    List<MemberDTO> updatePercentages(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody PercentagesUpdateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.updatePercentages(groupId, data, principal.email());
    }

    @DeleteMapping(value = "/{groupId}/members/percentages", produces = "application/json")
    @Operation(summary = "Confirmar la salida de miembros DEACTIVATED y reajustar porcentajes para que el total sea 100 (solo fundador/admin)")
    @ApiResponse(responseCode = "403", description = "Caller lacks permission", content = @Content)
    @ApiResponse(responseCode = "409", description = "Un miembro no está DEACTIVATED o el total no suma 100", content = @Content)
    List<MemberDTO> finalizeExits(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody FinalizeExitsDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.finalizeExits(groupId, data, principal.email());
    }
}