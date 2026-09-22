package EsNuestro.common.exception;

public class ItemNotFoundException extends Exception {
    public ItemNotFoundException(String entity, Long id) {
        super(String.format("Failed to find %s with id %s", entity, id));
    }
    public ItemNotFoundException(String entity, String identifier) {
        super(String.format("Failed to find %s with identifier %s", entity, identifier));
    }
}
