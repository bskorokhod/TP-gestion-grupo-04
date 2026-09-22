package EsNuestro.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity(name = "users")
@NoArgsConstructor
public class User implements UserDetails, UserCredentials {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String surname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column
    private String photoUrl;

    @Column
    private String cvu;

    public User(String password, String role, String name, String surname, String email, String photoUrl, String cvu) {
        this.password = password;
        this.role = role;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.photoUrl = photoUrl;
        this.cvu = cvu;
    }

    // El identificador del usuario es el email: se lo exponemos como "username"
    // unicamente porque asi lo exige la interfaz UserDetails de Spring Security.
    @Override
    public String getUsername() {
        return this.email;
    }

    public Long getId() {return this.id;}

    public String getName() {
        return name;
    }

    public String getSurname() {
        return surname;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }
    public String getCvu() {return cvu;}

    public void setRole(String role) {
        this.role = role;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    // NO BORRAR
    // Parecen innecesarios, pero lo son para que implementen la interfaz de UserDetails y UserCredentials
    @Override
    public String email() {
        return this.email;
    }

    @Override
    public String password() {
        return this.password;
    }

    public String getEmail() {
        return this.email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    public String getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
}
