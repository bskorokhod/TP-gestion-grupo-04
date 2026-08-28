package ar.uba.fi.ingsoft1.product_example.user;

import lombok.experimental.FieldNameConstants;

@FieldNameConstants(onlyExplicitlyIncluded = true)
public enum UserRole {
    @FieldNameConstants.Include ADMIN,
    @FieldNameConstants.Include USER;

    public String toStringWithPrefix() {
        return "ROLE_" + this;
    }
}
