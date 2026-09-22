
import React, {Dispatch, useCallback, useContext, useState} from "react";

import {AuthResponse} from "@/models/User.ts";
import {useRefresh} from "@/services/AuthServices.ts";
import {TokenService} from "@/services/TokenService.ts";

const TOKEN_STORAGE_KEY = "tokens";

type TokenContextData =
    | {
    state: "LOGGED_OUT";
}
    | {
    state: "REFRESHING";
    tokenPromise: Promise<AuthResponse>;
}
    | {
    state: "LOGGED_IN";
    tokens: AuthResponse;
};

const TokenContext = React.createContext<[TokenContextData, Dispatch<TokenContextData>] | null>(null);

export const TokenProvider = ({children}: React.PropsWithChildren) => {
    const [state, setInternalState] = useState<TokenContextData>(getInitialTokenState);
    const setState = useCallback(
        (state: TokenContextData) => {
            if (state.state === "LOGGED_IN") {
                localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(state.tokens));
            } else {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
            setInternalState(state);
        },
        [setInternalState],
    );
    return <TokenContext.Provider value={[state, setState]}>{children}</TokenContext.Provider>;
};

export function useToken() {
    const context = useContext(TokenContext);
    if (context === null) {
        throw new Error("React tree should be wrapped in TokenProvider");
    }
    return context;
}

export function useAccessTokenGetter() {
    const [tokenState] = useToken();

    return async function getAccessToken() {
        switch (tokenState.state) {
            case "LOGGED_OUT":
                throw new Error("Auth needed for service");
            case "REFRESHING":
                return (await tokenState.tokenPromise).accessToken;
            case "LOGGED_IN":
                return tokenState.tokens.accessToken;
            default:
                // Make the compiler check this is unreachable
                return tokenState satisfies never;
        }
    };
}

export function useHandleResponse() {
    const {mutate} = useRefresh();

    return async function handleResponse<T>(response: Response, parse: (json: unknown) => T) {
        if (response.status === 401) {
            mutate();
            throw new Error("Attempting token refresh");
        } else if (response.ok) {
            return parse(await response.json());
        } else {
            throw new Error(`Failed with status ${response.status}: ${await response.text()}`);
        }
    };
}

const getInitialTokenState = (): TokenContextData => {
    // No alcanza con que el valor guardado tenga la forma correcta: hay que confirmar que el
    // access token siga siendo válido (no expirado) antes de asumir una sesión activa. Si falta,
    // está corrupto o expiró, se limpia la persistencia y se arranca estrictamente deslogueado
    // (evita el "falso login" con una cuenta inválida/inexistente, p. ej. tras resetear el backend).
    const tokens = TokenService.getStoredTokens(TOKEN_STORAGE_KEY);
    if (tokens && TokenService.isTokenValid(tokens.accessToken)) {
        return {state: "LOGGED_IN", tokens};
    }
    TokenService.clearStoredTokens(TOKEN_STORAGE_KEY);
    return {state: "LOGGED_OUT"};
};
