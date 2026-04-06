import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import {
  IProjectRepository,
  CreateProjectData,
  UpdateProjectData,
} from "../domain/repositories/project.repository.interface";
import { Project } from "../domain/project.entity";

@Injectable()
export class PrismaProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectData): Promise<Project> {
    const row = await this.prisma.project.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
      },
    });
    return this.toEntity(row);
  }

  async findManyByUserId(userId: string): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Project | null> {
    const row = await this.prisma.project.findFirst({
      where: { id, userId },
    });
    return row ? this.toEntity(row) : null;
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    data: UpdateProjectData,
  ): Promise<Project> {
    const row = await this.prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
    return this.toEntity(row);
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<void> {
    // Unassign tasks first, then delete project — within a transaction
    await this.prisma.$transaction([
      this.prisma.task.updateMany({
        where: { projectId: id, userId },
        data: { projectId: null },
      }),
      this.prisma.project.delete({ where: { id } }),
    ]);
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.project.count({ where: { userId } });
  }

  private toEntity(row: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    color: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Project {
    return new Project(
      row.id,
      row.userId,
      row.name,
      row.description,
      row.color,
      row.createdAt,
      row.updatedAt,
    );
  }
}
