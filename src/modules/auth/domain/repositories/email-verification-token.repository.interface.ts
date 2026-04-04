import { EmailVerificationToken } from "../email-verification-token.entity";

export interface CreateEmailVerificationTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol(
  "EMAIL_VERIFICATION_TOKEN_REPOSITORY",
);

export interface IEmailVerificationTokenRepository {
  create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationToken>;
  findValidByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null>;
  markUsed(id: string): Promise<void>;
  invalidateUnusedForUser(userId: string): Promise<void>;
}
