package EsNuestro.user.dtos;

import EsNuestro.user.User;
import lombok.NonNull;

public record UserProfileDTO(
        @NonNull String name,
        @NonNull String surname,
        String photoUrl
) {
    public UserProfileDTO(User user) {
        this(user.getName(), user.getSurname(), user.getPhotoUrl());
    }
}
