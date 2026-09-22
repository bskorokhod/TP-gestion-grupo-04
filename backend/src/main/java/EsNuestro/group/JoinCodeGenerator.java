package EsNuestro.group;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.stream.Collectors;

/**
 * Genera códigos de unión con formato XXX-YYYY-XXX (X = letra mayúscula, Y = dígito).
 */
@Component
class JoinCodeGenerator {

    private static final String LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";

    private final SecureRandom random = new SecureRandom();

    String generate() {
        return randomChars(LETTERS, 3) + "-" + randomChars(DIGITS, 4) + "-" + randomChars(LETTERS, 3);
    }

    private String randomChars(String alphabet, int length) {
        return random.ints(length, 0, alphabet.length())
                .mapToObj(index -> String.valueOf(alphabet.charAt(index)))
                .collect(Collectors.joining());
    }
}