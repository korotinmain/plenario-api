import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
} from "../domain/repositories/user.repository.interface";
import { User } from "../domain/user.entity";

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        timezone: data.timezone ?? "UTC",
        settings: {
          create: { timezone: data.timezone ?? "UTC" },
        },
      },
    });
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl,
        timezone: data.timezone,
      },
    });
    return this.toEntity(row);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  private toEntity(row: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    timezone: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      row.id,
      row.email,
      row.name,
      row.avatarUrl,
      row.emailVerified,
      row.timezone,
      row.createdAt,
      row.updatedAt,
    );
  }
}
