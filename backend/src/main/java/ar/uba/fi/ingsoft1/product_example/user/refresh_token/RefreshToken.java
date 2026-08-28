package ar.uba.fi.ingsoft1.product_example.user.refresh_token;

import ar.uba.fi.ingsoft1.product_example.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {
    @Id
    private String value;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private Instant expiresAt;

    public String value() {
        return this.value;
    }

    public User user() {
        return this.user;
    }

    public boolean isValid() {
        return expiresAt.isAfter(Instant.now());
    }
}
