package EsNuestro.common.api.response;

import java.util.HashMap;

public class JsonResponse extends HashMap<String, Object> {

    public JsonResponse() {
        super();
    }

    public JsonResponse buildField(String key, Object value) {
        this.put(key, value);
        return this;
    }

    public JsonResponse buildSuccess(boolean success) {
        return buildField("success", success);
    }

    public JsonResponse buildMessage(String message) {
        return buildField("message", message);
    }

    public JsonResponse buildResults(Object results) {
        return buildField("results", results);
    }
}
