package ar.uba.fi.ingsoft1.product_example.common.exception;

public class ItemNotFoundException extends Exception {
    public ItemNotFoundException(String entity, Long id) {
        super(String.format("Failed to find %s with id %s", entity, id));
    }
}
