package EsNuestro.user.refresh_token;

import EsNuestro.user.User;
import jakarta.persistence.*;
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
