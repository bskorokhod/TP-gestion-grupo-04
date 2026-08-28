package EsNuestro.brands;

import lombok.NonNull;

public record BrandCreateDTO(
        @NonNull String name
) {
    public Brand asBrand() {
        return new Brand(name);
    }
}
