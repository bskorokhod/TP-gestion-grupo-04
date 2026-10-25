package EsNuestro.common.api;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Página de resultados con solo lo que necesita el cliente. Se usa en lugar de serializar {@code Page} de Spring
 * directamente, cuyo JSON no es un contrato estable. {@code page} arranca en 0.
 */
public record PageDTO<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {

    public static <T> PageDTO<T> from(Page<T> page) {
        return new PageDTO<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext()
        );
    }
}
