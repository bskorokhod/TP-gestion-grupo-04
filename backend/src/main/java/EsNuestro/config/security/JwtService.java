package EsNuestro.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private final String secret;
    private final Long expiration;

    @Autowired
    public JwtService(
            @Value("${jwt.access.secret}") String secret,
            @Value("${jwt.access.expiration}") Long expiration
    ) {
        this.secret = secret;
        this.expiration = expiration;
    }

    public String createToken(JwtUserDetails claims) {
        return Jwts.builder()
                .subject(claims.email())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .claim("role", claims.role())
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    public UsernamePasswordAuthenticationToken getAuthentication(String token) {
        Optional<JwtUserDetails> maybeUser = extractVerifiedUserDetails(token);
        if (maybeUser.isEmpty()) return null;

        JwtUserDetails user = maybeUser.get();

        return new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
    }

    Optional<JwtUserDetails> extractVerifiedUserDetails(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            if (claims.containsKey("sub")
                    && claims.containsKey("role")
                    && claims.get("role") instanceof String role
            ) {
                return Optional.of(new JwtUserDetails(claims.getSubject(), role));
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return Optional.empty();
    }

    private SecretKey getSigningKey() {
        byte[] bytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(bytes);
    }
}
