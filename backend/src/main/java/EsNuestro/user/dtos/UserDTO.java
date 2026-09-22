package EsNuestro.user.dtos;

import EsNuestro.user.User;

public record UserDTO(
        String role,
        String name,
        String surname,
        String email,
        String photoUrl,
        String cvu
) {
    public UserDTO(User user) {
        this(user.getRole(), user.getName(), user.getSurname(), user.getEmail(), user.getPhotoUrl(), user.getCvu());
    }
}
