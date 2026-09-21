import { jwtDecode } from 'jwt-decode';
import { AuthResponse, AuthResponseSchema } from "@/models/User.ts";

export interface DecodedToken {
    sub: string;
    exp: number;
    iat: number;
}

export interface UserFromToken {
    username: string;
}

export class TokenService {
    static decodeToken(token: string): DecodedToken | null {
        try {
            return jwtDecode<DecodedToken>(token);
        } catch (err) {
            console.error('Error decoding token', err);
            return null
        }
    }

    static getUserFromToken(token: string): UserFromToken | null {
        const decoded = this.decodeToken(token);
        if (!decoded || this.isTokenExpired(decoded)) {
            return null;
        }

        return {
            username: decoded.sub,
        };
    }

    static getUsernameFromToken(token: string): string | null {
        const userData = this.getUserFromToken(token);
        return userData?.username ?? null
    }

    static isTokenValid(token: string): boolean {
        const decoded = this.decodeToken(token);
        return !!decoded && !this.isTokenExpired(decoded);
    }

    static getStoredTokens(storageKey: string = "tokens"): AuthResponse | null {
        try {
            const storedData = localStorage.getItem(storageKey);
            if (!storedData) return null;

            return AuthResponseSchema.parse(JSON.parse(storedData));
        } catch (err) {
            console.error('Error reading stored tokens:', err);
            return null;
        }
    }

    static clearStoredTokens(storageKey: string = "tokens"): void {
        localStorage.removeItem(storageKey);
    }

    private static isTokenExpired(decodedToken: DecodedToken | null): boolean {
        if (!decodedToken?.exp){
            return true
        }
        return Date.now() / 1000 > decodedToken.exp;
    }


}