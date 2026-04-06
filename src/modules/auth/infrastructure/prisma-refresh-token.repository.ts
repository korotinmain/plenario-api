import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { IRefreshTokenRepository } from "../domain/repositories/refresh-token.repository.interface";

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({ data });
  }

  async findByHash(
    tokenHash: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });
    return token;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteByHash(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken
      .delete({ where: { tokenHash } })
      .catch(() => {
        // Silently ignore if token was already deleted
      });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
