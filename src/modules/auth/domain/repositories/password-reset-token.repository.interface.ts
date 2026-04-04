import { PasswordResetToken } from "../password-reset-token.entity";

export interface CreatePasswordResetTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  "PASSWORD_RESET_TOKEN_REPOSITORY",
);

export interface IPasswordResetTokenRepository {
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;
  findValidByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string): Promise<void>;
  invalidateUnusedForUser(userId: string): Promise<void>;
}
