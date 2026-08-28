package ar.uba.fi.ingsoft1.product_example.products;

import ar.uba.fi.ingsoft1.product_example.brands.Brand;
import ar.uba.fi.ingsoft1.product_example.brands.BrandRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Test
    void findByNameContaining() {
        var brand = brandRepository.save(new Brand(null, "Brand Name", List.of()));

        var product1 = new Product("Product 1", "Description 1", brand);

        productRepository.save(product1);
        productRepository.save(new Product("Product 2", "Description 2", brand));
        var result = productRepository.findByNameContaining("t 1");

        assertEquals(List.of(product1), result);
    }
}