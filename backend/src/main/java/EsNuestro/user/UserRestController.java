package EsNuestro.user;

import EsNuestro.common.api.response.JsonResponse;
import EsNuestro.common.api.response.JsonResponseDirector;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.user.dtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


import java.util.Optional;

@RestController
@RequestMapping("/users")
@Tag(name = "1 - Users")
class UserRestController {
    private final UserService userService;

    @Autowired
    UserRestController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping(produces = "application/json")
    @Operation(summary = "Create a new user")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "409", description = "User already exists", content = @Content)
    ResponseEntity<JsonResponse> signUp(
            @Valid @NonNull @RequestBody UserCreateDTO data
    ) {
        return userService.createUser(data)
                .map(this::createSuccessResponse)
                .orElse(ResponseEntity.status(HttpStatus.CONFLICT).body(JsonResponseDirector.createUnsuccessfulResponse("User already exists")));
    }

    private ResponseEntity<JsonResponse> createSuccessResponse(TokenDTO tk) {
        JsonResponse response = JsonResponseDirector.createSuccessfulResponseWithToken("User created successfully", tk.accessToken(), tk.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @GetMapping("/profile")
    public ResponseEntity<JsonResponse> getProfileData() {
        String email = getEmailFromContext();
        UserDTO user = userService.getUserByEmail(email).get();

        UserProfileDTO userProfileDTO = new UserProfileDTO(user.name(), user.surname(), user.photoUrl());

        JsonResponse response = JsonResponseDirector.createSuccessfulResponseWithResults(userProfileDTO);
        return ResponseEntity.ok().body(response);
    }

    @PatchMapping("/profile")
    public ResponseEntity<JsonResponse> updateUserPhoto(
            @Valid @RequestBody UserPhotoUpdateDTO updateDTO
    ) {
        String email = getEmailFromContext();
        Optional<UserDTO> updatedUser = userService.updatePhoto(email, updateDTO);

        if (updatedUser.isEmpty()) {
            JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse("User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        JsonResponse response = JsonResponseDirector.createSuccessfulResponse("User photo updated successfully");
        return ResponseEntity.ok().body(response);

    }

    private String getEmailFromContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtUserDetails details = (JwtUserDetails) authentication.getPrincipal();

        return details.email();
    }
}
