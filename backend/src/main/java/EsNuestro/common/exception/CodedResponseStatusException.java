package EsNuestro.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** {@link ResponseStatusException} con un {@link ErrorCode} estable que el handler global agrega al cuerpo de error. */
public class CodedResponseStatusException extends ResponseStatusException {

    private final ErrorCode code;

    public CodedResponseStatusException(HttpStatus status, ErrorCode code, String reason) {
        super(status, reason);
        this.code = code;
    }

    public ErrorCode getCode() {
        return code;
    }
}
