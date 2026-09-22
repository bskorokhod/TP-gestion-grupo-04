import { jwtDecode } from "jwt-decode";

import { AuthResponse, AuthResponseSchema } from "@/models/User.ts";

export interface DecodedToken {
    sub: string;
    exp: number;
    iat: number;
}

export interface UserFromToken {
    username: string;
}

const DEFAULT_STORAGE_KEY = "tokens";

export class TokenService {
    static decodeToken(token: string): DecodedToken | null {
        try {
            return jwtDecode<DecodedToken>(token);
        } catch {
            return null;
        }
    }

    static getUserFromToken(token: string): UserFromToken | null {
        const decoded = this.decodeToken(token);
        if (!decoded || this.isTokenExpired(decoded)) return null;
        return { username: decoded.sub };
    }

    static getUsernameFromToken(token: string): string | null {
        return this.getUserFromToken(token)?.username ?? null;
    }

    static isTokenValid(token: string): boolean {
        const decoded = this.decodeToken(token);
        return decoded !== null && !this.isTokenExpired(decoded);
    }

    static getStoredTokens(storageKey: string = DEFAULT_STORAGE_KEY): AuthResponse | null {
        try {
            const stored = localStorage.getItem(storageKey);
            if (!stored) return null;
            return AuthResponseSchema.parse(JSON.parse(stored));
        } catch {
            return null;
        }
    }

    static clearStoredTokens(storageKey: string = DEFAULT_STORAGE_KEY): void {
        localStorage.removeItem(storageKey);
    }

    private static isTokenExpired(decodedToken: DecodedToken | null): boolean {
        if (!decodedToken?.exp) return true;
        return Date.now() / 1000 > decodedToken.exp;
    }
}