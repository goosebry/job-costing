import jwt from 'jsonwebtoken';
declare const ACCESS_TOKEN_EXPIRY = "24h";
declare const REFRESH_TOKEN_EXPIRY = "7d";
declare const SALT_ROUNDS = 12;
interface TokenPayload {
    userId: string;
    role: string;
    organizationId: string;
}
interface Tokens {
    accessToken: string;
    refreshToken: string;
}
export declare function sign(payload: object, secret: string, options?: jwt.SignOptions): string;
export declare function verify(token: string, secret: string): TokenPayload;
export declare function hash(data: string): Promise<string>;
export declare function compare(data: string, encrypted: string): Promise<boolean>;
export declare function generateTokens(userId: string, role: string, organizationId: string): Tokens;
export { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, SALT_ROUNDS };
//# sourceMappingURL=auth.d.ts.map