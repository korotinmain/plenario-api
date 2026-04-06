export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
}

export const JWT_TOKEN_SERVICE = Symbol("JWT_TOKEN_SERVICE");

export interface IJwtTokenService {
  generateTokenPair(userId: string, email: string): Promise<TokenPair>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
