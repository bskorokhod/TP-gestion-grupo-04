package EsNuestro.user;

import EsNuestro.config.security.JwtService;
import EsNuestro.user.refresh_token.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private UserService userService;

    private static final String USERNAME = "user";
    private static final String PASSWORD = "password";

    @BeforeEach
    void setup() {
        var passwordEncoder = new BCryptPasswordEncoder();
        var passwordHash = passwordEncoder.encode(PASSWORD);

        UserRepository userRepository = mock();
        when(userRepository.findByUsername(anyString()))
                .thenReturn(Optional.empty());
        when(userRepository.findByUsername(USERNAME))
                .thenReturn(Optional.of(new User(USERNAME, passwordHash, UserRole.USER)));

        var key = "0".repeat(64);
        userService = new UserService(
                new JwtService(key, 1L),
                new BCryptPasswordEncoder(),
                userRepository,
                new RefreshTokenService(1L, 20, mock())
        );
    }

    @Test
    void loginUser() {
        var response = userService.loginUser(new UserLoginDTO(USERNAME, PASSWORD));
        assertNotNull(response.orElseThrow());
    }

    @Test
    void loginWithWrongPassword() {
        var response = userService.loginUser(new UserLoginDTO(USERNAME, PASSWORD + "_wrong"));
        assertEquals(Optional.empty(), response);
    }

    @Test
    void loginNonexistentUser() {
        var response = userService.loginUser(new UserLoginDTO(USERNAME + "_wrong", PASSWORD));
        assertEquals(Optional.empty(), response);
    }
}