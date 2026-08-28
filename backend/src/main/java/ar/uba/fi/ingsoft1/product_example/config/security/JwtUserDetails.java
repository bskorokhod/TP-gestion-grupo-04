package ar.uba.fi.ingsoft1.product_example.config.security;

import ar.uba.fi.ingsoft1.product_example.user.UserRole;

public record JwtUserDetails (
        String username,
        UserRole role
) {}