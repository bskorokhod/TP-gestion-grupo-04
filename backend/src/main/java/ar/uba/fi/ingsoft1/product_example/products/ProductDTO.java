package ar.uba.fi.ingsoft1.product_example.products;

record ProductDTO(
        long id,
        String name,
        String description
) {
    public ProductDTO(Product product) {
        this(product.getId(), product.getName(), product.getDescription());
    }
}
