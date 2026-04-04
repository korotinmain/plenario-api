import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import {
  IEmailVerificationTokenRepository,
  CreateEmailVerificationTokenData,
} from "../domain/repositories/email-verification-token.repository.interface";
import { EmailVerificationToken } from "../domain/email-verification-token.entity";

@Injectable()
export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationToken> {
    const row = await this.prisma.emailVerificationToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
    return this.toEntity(row);
  }

  async findValidByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    const row = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateUnusedForUser(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  private toEntity(row: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }): EmailVerificationToken {
    return new EmailVerificationToken(
      row.id,
      row.userId,
      row.tokenHash,
      row.expiresAt,
      row.usedAt,
      row.createdAt,
    );
  }
}
