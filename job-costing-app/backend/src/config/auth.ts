import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 12;

interface TokenPayload {
  userId: string;
  role: string;
  organizationId: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export function sign(payload: object, secret: string, options?: jwt.SignOptions): string {
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY, ...options });
}

export function verify(token: string, secret: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}

export async function hash(data: string): Promise<string> {
  return bcrypt.hash(data, SALT_ROUNDS);
}

export async function compare(data: string, encrypted: string): Promise<boolean> {
  return bcrypt.compare(data, encrypted);
}

export function generateTokens(userId: string, role: string, organizationId: string): Tokens {
  const payload: TokenPayload = { userId, role, organizationId };
  const accessToken = sign(payload, process.env.JWT_SECRET || 'default-secret-change-in-production', {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET || 'default-secret-change-in-production',
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { accessToken, refreshToken };
}

export { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, SALT_ROUNDS };