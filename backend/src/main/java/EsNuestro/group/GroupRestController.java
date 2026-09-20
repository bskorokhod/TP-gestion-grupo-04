package EsNuestro.group;

import EsNuestro.common.exception.ItemNotFoundException;
import EsNuestro.config.security.JwtUserDetails;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;

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
        return groupService.createGroup(data, principal.username());
    }

    @GetMapping(produces = "application/json")
    @Operation(summary = "List the groups the caller actively belongs to")
    List<GroupDTO> listMine(@AuthenticationPrincipal JwtUserDetails principal) {
        return groupService.listMyGroups(principal.username());
    }

    @GetMapping(value = "/{groupId}", produces = "application/json")
    @Operation(summary = "Get a group's details")
    @ApiResponse(responseCode = "404", description = "Group not found", content = @Content)
    GroupDTO get(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.getGroup(groupId, principal.username());
    }

    @GetMapping(value = "/{groupId}/members", produces = "application/json")
    @Operation(summary = "List a group's members")
    @ApiResponse(responseCode = "404", description = "Group not found", content = @Content)
    List<MemberDTO> listMembers(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        return groupService.listMembers(groupId, principal.username());
    }

    @PostMapping(value = "/{groupId}/members", produces = "application/json")
    @Operation(summary = "Invite a user to the group (founder/admin only)")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "403", description = "Caller lacks permission to invite", content = @Content)
    @ApiResponse(responseCode = "404", description = "Group or user not found", content = @Content)
    @ApiResponse(responseCode = "409", description = "User is already a member", content = @Content)
    MemberDTO invite(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody MemberInviteDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.inviteMember(groupId, data, principal.username());
    }

    @PostMapping("/{groupId}/members/me/accept")
    @Operation(summary = "Accept a pending invitation to the group")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(responseCode = "409", description = "No pending invitation found", content = @Content)
    void acceptInvitation(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        groupService.acceptInvitation(groupId, principal.username());
    }

    @PostMapping("/{groupId}/members/me/reject")
    @Operation(summary = "Reject a pending invitation to the group")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(responseCode = "409", description = "No pending invitation found", content = @Content)
    void rejectInvitation(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        groupService.rejectInvitation(groupId, principal.username());
    }

    @DeleteMapping("/{groupId}/members/me")
    @Operation(summary = "Leave the group")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(responseCode = "409", description = "The founder cannot leave the group", content = @Content)
    void leave(
            @PathVariable Long groupId,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException {
        groupService.leaveGroup(groupId, principal.username());
    }

    @PatchMapping(value = "/{groupId}/members/me/nickname", produces = "application/json")
    @Operation(summary = "Change the caller's own nickname within the group")
    @ApiResponse(responseCode = "409", description = "Nickname already taken in this group", content = @Content)
    MemberDTO changeMyNickname(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody MemberNicknameUpdateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.changeNickname(groupId, principal.username(), data.nickname());
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
        groupService.removeMember(groupId, memberId, principal.username());
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
        return groupService.changeRole(groupId, memberId, data.role(), principal.username());
    }

    @PutMapping(value = "/{groupId}/members/percentages", produces = "application/json")
    @Operation(summary = "Set/adjust ownership percentages and activate pending members (founder/admin only)")
    @ApiResponse(responseCode = "403", description = "Caller lacks permission", content = @Content)
    @ApiResponse(responseCode = "409", description = "Percentages invalid or incomplete", content = @Content)
    List<MemberDTO> updatePercentages(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody PercentagesUpdateDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.updatePercentages(groupId, data, principal.username());
    }

    @DeleteMapping(value = "/{groupId}/members/percentages", produces = "application/json")
    @Operation(summary = "Finalize deactivated members' exit and rebalance remaining active members (founder/admin only)")
    @ApiResponse(responseCode = "403", description = "Caller lacks permission", content = @Content)
    @ApiResponse(responseCode = "409", description = "A member isn't deactivated, or percentages don't match", content = @Content)
    List<MemberDTO> finalizeExits(
            @PathVariable Long groupId,
            @Valid @NonNull @RequestBody FinalizeExitsDTO data,
            @AuthenticationPrincipal JwtUserDetails principal
    ) throws ItemNotFoundException, MethodArgumentNotValidException {
        return groupService.finalizeExits(groupId, data, principal.username());
    }
}
