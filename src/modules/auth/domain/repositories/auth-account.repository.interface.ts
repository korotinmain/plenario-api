import { AuthAccount, AuthProvider } from "../auth-account.entity";

export interface CreateAuthAccountData {
  userId: string;
  provider: AuthProvider;
  providerAccountId: string;
  passwordHash?: string;
}

export const AUTH_ACCOUNT_REPOSITORY = Symbol("AUTH_ACCOUNT_REPOSITORY");

export interface IAuthAccountRepository {
  findCredentialsByEmail(email: string): Promise<AuthAccount | null>;
  findByProviderAccount(
    provider: AuthProvider,
    providerAccountId: string,
  ): Promise<AuthAccount | null>;
  findProvidersByUserId(userId: string): Promise<AuthAccount[]>;
  create(data: CreateAuthAccountData): Promise<AuthAccount>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}
