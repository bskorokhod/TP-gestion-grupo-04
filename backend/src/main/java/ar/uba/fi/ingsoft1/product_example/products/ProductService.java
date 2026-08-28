package ar.uba.fi.ingsoft1.product_example.products;

import ar.uba.fi.ingsoft1.product_example.brands.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;

    public List<ProductDTO> getProducts(ProductSearchDTO filter) {
        return productRepository
                .findByNameContaining(filter.name().orElse(""))
                .stream()
                .map(ProductDTO::new)
                .toList();
    }

    public Optional<ProductDTO> getProductById(long id) {
        return productRepository.findById(id).map(ProductDTO::new);
    }

    public ProductDTO createProduct(ProductCreateDTO data) {
        var product = data.asProduct(brandRepository::getReferenceById);
        return new ProductDTO(productRepository.save(product));
    }

    public Optional<ProductDTO> updateProduct(Long id, ProductUpdateDTO update) {
        return productRepository.findById(id)
                .map(update::applyTo)
                .map(productRepository::save)
                .map(ProductDTO::new);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}
