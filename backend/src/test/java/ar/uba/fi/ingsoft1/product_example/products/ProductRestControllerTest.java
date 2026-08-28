package ar.uba.fi.ingsoft1.product_example.products;

import ar.uba.fi.ingsoft1.product_example.config.security.JwtService;
import ar.uba.fi.ingsoft1.product_example.config.security.SecurityConfig;
import ar.uba.fi.ingsoft1.product_example.user.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Optional;

import static org.mockito.Mockito.when;

@WebMvcTest(controllers = ProductRestController.class)
@Import({SecurityConfig.class, JwtService.class})
class ProductRestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @Test
    @WithMockUser
    void getExistingProductById() throws Exception {
        final long id = 1;
        final String name = "Name";
        final String description = "Description";

        var dto = new ProductDTO(id, name, description);
        when(productService.getProductById(id)).thenReturn(Optional.of(dto));

        var request = get("/products/" + id)
                .contentType(MediaType.APPLICATION_JSON);
        mockMvc.perform(request).andExpectAll(
                status().isOk(),
                jsonPath("$.id").value(id),
                jsonPath("$.name").value(name),
                jsonPath("$.description").value(description)
        );
    }

    @Test
    @WithMockUser
    void getAbsentProductById() throws Exception {
        final long id = 1;

        when(productService.getProductById(id)).thenReturn(Optional.empty());

        var request = get("/products/" + id)
                .contentType(MediaType.APPLICATION_JSON);
        mockMvc.perform(request).andExpectAll(
                status().isNotFound()
        );
    }

    @Test
    @WithMockUser(roles = {UserRole.Fields.ADMIN})
    void createProductSuccessfully() throws Exception {
        var newProduct = new ProductCreateDTO("Name", "Description", 1);
        var resultProduct = new ProductDTO(1L, "Name", "Description");
        when(productService.createProduct(newProduct)).thenReturn(resultProduct);

        var request = post("/products")
                .content("{\"name\":\"Name\",\"description\":\"Description\",\"brandId\":1}")
                .contentType(MediaType.APPLICATION_JSON);
        mockMvc.perform(request).andExpectAll(
                status().isCreated(),
                jsonPath("$.id").value(resultProduct.id()),
                jsonPath("$.name").value(resultProduct.name()),
                jsonPath("$.description").value(resultProduct.description())
        );
    }

    @Test
    @WithMockUser
    void createProductWithRegularUser() throws Exception {
        var newProduct = new ProductCreateDTO("Name", "Description", 1);
        var resultProduct = new ProductDTO(1L, "Name", "Description");
        when(productService.createProduct(newProduct)).thenReturn(resultProduct);

        var request = post("/products")
                .content("{\"name\":\"Name\",\"description\":\"Description\",\"brandId\":1}")
                .contentType(MediaType.APPLICATION_JSON);
        mockMvc.perform(request).andExpectAll(
                status().isForbidden()
        );
    }

    @Test
    @WithMockUser(roles = {UserRole.Fields.ADMIN})
    void createProductWithMalformedJson() throws Exception {
        var request = post("/products")
                .content("{")
                .contentType(MediaType.APPLICATION_JSON);
        mockMvc.perform(request).andExpectAll(
                status().isBadRequest()
        );
    }

    @Test
    @WithMockUser(roles = {UserRole.Fields.ADMIN})
    void createProductWithBadJson() throws Exception {
        var request = post("/products")
                .content("{\"error\":1}")
                .contentType(MediaType.APPLICATION_JSON);
        mockMvc.perform(request).andExpectAll(
                status().isBadRequest()
        );
    }
}