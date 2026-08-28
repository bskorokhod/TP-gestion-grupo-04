package EsNuestro.products;

record ProductDTO(
        long id,
        String name,
        String description
) {
    public ProductDTO(Product product) {
        this(product.getId(), product.getName(), product.getDescription());
    }
}
