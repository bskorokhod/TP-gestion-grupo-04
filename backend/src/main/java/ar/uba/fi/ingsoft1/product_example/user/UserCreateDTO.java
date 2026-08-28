package ar.uba.fi.ingsoft1.product_example.user;

import jakarta.validation.constraints.NotBlank;
import lombok.NonNull;

import java.util.function.Function;

public record UserCreateDTO(
        @NotBlank String username,
        @NotBlank String password,
        @NonNull UserRole role
) implements UserCredentials {
    public User asUser(Function<String, String> encryptPassword) {
        return new User(username, encryptPassword.apply(password), role);
    }
}
