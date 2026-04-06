export const REFRESH_TOKEN_REPOSITORY = Symbol("REFRESH_TOKEN_REPOSITORY");

export interface IRefreshTokenRepository {
  create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findByHash(
    tokenHash: string,
  ): Promise<{ userId: string; expiresAt: Date } | null>;
  deleteByUserId(userId: string): Promise<void>;
  deleteByHash(tokenHash: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
