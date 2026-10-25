package EsNuestro.user.dtos;

import EsNuestro.user.User;
import lombok.NonNull;

public record UserProfileDTO(
        @NonNull Long id,
        @NonNull String name,
        @NonNull String surname,
        String photoUrl,
        @NonNull String email
) {
    public UserProfileDTO(User user) {
        this(user.getId(), user.getName(), user.getSurname(), user.getPhotoUrl(), user.getEmail());
    }
}
