package EsNuestro.user;

import EsNuestro.common.api.response.JsonResponse;
import EsNuestro.common.api.response.JsonResponseDirector;
import EsNuestro.user.dtos.RefreshDTO;
import EsNuestro.user.dtos.UserLoginDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sessions")
@Tag(name = "2 - Sessions")
class SessionRestController {

    private final UserService userService;

    @Autowired
    SessionRestController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping(produces = "application/json")
    @Operation(summary = "Log in, creating a new session")
    public ResponseEntity<JsonResponse> login(
            @Valid @NonNull @RequestBody UserLoginDTO data
    ) {
        return userService
                .loginUser(data)
                .map(token -> {
                    JsonResponse response = JsonResponseDirector.createSuccessfulResponseWithToken("Session created successfully. User can log in", token.accessToken(), token.refreshToken());
                    return ResponseEntity.status(HttpStatus.CREATED).body(response);
                })
                .orElseGet(() -> {
                    JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse("Invalid email or password supplied");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                });
    }

    @PutMapping(produces = "application/json")
    @Operation(summary = "Refresh a session")
    public ResponseEntity<JsonResponse> refresh(
            @Valid @NonNull @RequestBody RefreshDTO data
    ) {
        return userService
                .refresh(data)
                .map(token -> {
                    JsonResponse response = JsonResponseDirector.createSuccessfulResponseWithToken("Session refreshed", token.accessToken(), token.refreshToken());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse("Invalid refresh token supplied");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                });
    }
}
