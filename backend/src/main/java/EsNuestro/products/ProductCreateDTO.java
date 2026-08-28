package EsNuestro.products;

import EsNuestro.brands.Brand;
import lombok.NonNull;
import org.springframework.validation.annotation.Validated;

import java.util.function.LongFunction;

record ProductCreateDTO(
        @Validated @NonNull String name,
        @Validated @NonNull String description,
        long brandId
) {
    public Product asProduct(LongFunction<Brand> getBrand) {
        return new Product(name, description, getBrand.apply(brandId));
    }
}
