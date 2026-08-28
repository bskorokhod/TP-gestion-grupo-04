package EsNuestro.brands;

public record BrandDTO(
        long id,
        String name
) {
    public BrandDTO(Brand brand) {
        this(brand.getId(), brand.getName());
    }
}
