import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import {
  IAuthAccountRepository,
  CreateAuthAccountData,
} from "../domain/repositories/auth-account.repository.interface";
import { AuthAccount, AuthProvider } from "../domain/auth-account.entity";
import { AuthProvider as PrismaAuthProvider } from "@prisma/client";

@Injectable()
export class PrismaAuthAccountRepository implements IAuthAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCredentialsByEmail(email: string): Promise<AuthAccount | null> {
    const row = await this.prisma.authAccount.findFirst({
      where: {
        provider: PrismaAuthProvider.CREDENTIALS,
        providerAccountId: email,
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByProviderAccount(
    provider: AuthProvider,
    providerAccountId: string,
  ): Promise<AuthAccount | null> {
    const row = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: provider as PrismaAuthProvider,
          providerAccountId,
        },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findProvidersByUserId(userId: string): Promise<AuthAccount[]> {
    const rows = await this.prisma.authAccount.findMany({ where: { userId } });
    return rows.map((r) => this.toEntity(r));
  }

  async create(data: CreateAuthAccountData): Promise<AuthAccount> {
    const row = await this.prisma.authAccount.create({
      data: {
        userId: data.userId,
        provider: data.provider as PrismaAuthProvider,
        providerAccountId: data.providerAccountId,
        passwordHash: data.passwordHash ?? null,
      },
    });
    return this.toEntity(row);
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.authAccount.updateMany({
      where: { userId, provider: PrismaAuthProvider.CREDENTIALS },
      data: { passwordHash },
    });
  }

  private toEntity(row: {
    id: string;
    userId: string;
    provider: PrismaAuthProvider;
    providerAccountId: string;
    passwordHash: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AuthAccount {
    return new AuthAccount(
      row.id,
      row.userId,
      row.provider as unknown as AuthProvider,
      row.providerAccountId,
      row.passwordHash,
      row.createdAt,
      row.updatedAt,
    );
  }
}
