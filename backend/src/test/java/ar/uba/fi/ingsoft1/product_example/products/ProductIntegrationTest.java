package ar.uba.fi.ingsoft1.product_example.products;

import ar.uba.fi.ingsoft1.product_example.brands.Brand;
import ar.uba.fi.ingsoft1.product_example.brands.BrandRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@AutoConfigureMockMvc
class ProductIntegrationTest {

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private MockMvc mockMvc;

    Brand brand;

    @BeforeEach
    void setup() {
        brand = brandRepository.save(new Brand(null, "Brand", List.of()));
    }

    @Test
    @WithMockUser(username = "user")
    void getAllReturnsCreatedProduct() throws Exception {
        var name1 = "Name";
        var description = "Description";

        productService.createProduct(
                new ProductCreateDTO(name1, description, brand.getId())
        );
        var request = get("/products").contentType(MediaType.APPLICATION_JSON);
        mockMvc.perform(request).andExpectAll(
                status().isOk(),
                jsonPath("$[0].id").isNumber(),
                jsonPath("$[0].name").value("Name"),
                jsonPath("$[0].description").value("Description")
        );
    }

    @Test
    void getReturnsLatestUpdate() {
        var name1 = "First Name";
        var name2 = "Second Name";
        var description = "Description";

        var id = productService.createProduct(
                new ProductCreateDTO(name1, description, brand.getId())
        ).id();
        productService.updateProduct(
                id,
                new ProductUpdateDTO(Optional.of(name2), Optional.empty())
        );
        var response = productService.getProductById(id);

        assertEquals(name2, response.orElseThrow().name());
        assertEquals(description, response.orElseThrow().description());
    }
}
