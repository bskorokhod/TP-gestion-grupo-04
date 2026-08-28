package ar.uba.fi.ingsoft1.product_example.products;

import ar.uba.fi.ingsoft1.product_example.brands.Brand;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

        @Id
        @GeneratedValue
        private Long id;

        private String name;

        private String description;

        @ManyToOne
        private Brand brand;

        public Product(String name, String description, Brand brand) {
                this.name = name;
                this.description = description;
                this.brand = brand;
        }
}
