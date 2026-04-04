import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import {
  IPasswordResetTokenRepository,
  CreatePasswordResetTokenData,
} from "../domain/repositories/password-reset-token.repository.interface";
import { PasswordResetToken } from "../domain/password-reset-token.entity";

@Injectable()
export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreatePasswordResetTokenData,
  ): Promise<PasswordResetToken> {
    const row = await this.prisma.passwordResetToken.create({
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
  ): Promise<PasswordResetToken | null> {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateUnusedForUser(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
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
  }): PasswordResetToken {
    return new PasswordResetToken(
      row.id,
      row.userId,
      row.tokenHash,
      row.expiresAt,
      row.usedAt,
      row.createdAt,
    );
  }
}
