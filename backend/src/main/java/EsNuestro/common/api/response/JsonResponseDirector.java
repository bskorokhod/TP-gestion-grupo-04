package EsNuestro.common.api.response;

public class JsonResponseDirector {

    public static JsonResponse createSuccessfulResponseWithResults(Object results) {
        JsonResponse jsonResponse = new JsonResponse();
        return jsonResponse.buildSuccess(true)
                .buildResults(results);
    }

    public static JsonResponse createUnsuccessfulResponse(String message) {
        JsonResponse jsonResponse = new JsonResponse();
        return jsonResponse.buildSuccess(false)
                .buildMessage(message);
    }

    public static JsonResponse createSuccessfulResponse(String message) {
        JsonResponse jsonResponse = new JsonResponse();
        return jsonResponse.buildSuccess(true)
                .buildMessage(message);
    }

    public static JsonResponse createSuccessfulResponseWithToken(String message, String accessToken, String refreshToken) {
        JsonResponse jsonResponse = new JsonResponse();
        return jsonResponse.buildSuccess(true)
                .buildMessage(message)
                .buildField("accessToken", accessToken)
                .buildField("refreshToken", refreshToken);
    }
}
