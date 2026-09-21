package EsNuestro.config;

import EsNuestro.common.api.response.JsonResponse;
import EsNuestro.common.api.response.JsonResponseDirector;
import EsNuestro.common.exception.ItemNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalControllerExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentInvalid(MethodArgumentNotValidException ex) {
        JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse("Invalid arguments supplied: " + ex.getBindingResult().getFieldError().getDefaultMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse(ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(ItemNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleItemNotFound(ItemNotFoundException ex) {
        JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse(ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {

        JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse("Invalid request parameters: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable() {
        JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse("Invalid request body");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<JsonResponse> handleIllegalStateException(IllegalStateException ex) {
        JsonResponse response = JsonResponseDirector.createUnsuccessfulResponse(ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
}