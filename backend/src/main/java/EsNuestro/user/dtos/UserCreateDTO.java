package EsNuestro.user.dtos;

import EsNuestro.config.security.SecurityConfig;
import EsNuestro.user.User;
import EsNuestro.user.UserCredentials;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.function.Function;

public record UserCreateDTO(
        @NotBlank String password,
        @NotBlank String name,
        @NotBlank String surname,
        @NotBlank @Email String email,
        String photoUrl

) implements UserCredentials {
    public User asUser(Function<String, String> encryptPassword) {
        return new User(encryptPassword.apply(password), SecurityConfig.USER_ROLE, name, surname, email, photoUrl, null);
    }
}
