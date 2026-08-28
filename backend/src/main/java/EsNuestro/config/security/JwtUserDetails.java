package EsNuestro.config.security;

import EsNuestro.user.UserRole;

public record JwtUserDetails (
        String username,
        UserRole role
) {}