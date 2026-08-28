package ar.uba.fi.ingsoft1.product_example.brands;

import lombok.NonNull;

public record BrandCreateDTO(
        @NonNull String name
) {
    public Brand asBrand() {
        return new Brand(name);
    }
}
