import { Injectable } from "@nestjs/common";
import {
  TaskStatus as PrismaTaskStatus,
  TaskPriority as PrismaTaskPriority,
} from "@prisma/client";
import { PrismaService } from "../../../core/database/prisma.service";
import {
  ITaskRepository,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
} from "../domain/repositories/task.repository.interface";
import { Task, TaskStatus, TaskPriority } from "../domain/task.entity";

@Injectable()
export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskData): Promise<Task> {
    const row = await this.prisma.task.create({
      data: {
        userId: data.userId,
        projectId: data.projectId ?? null,
        title: data.title,
        description: data.description ?? null,
        status: (data.status as PrismaTaskStatus) ?? PrismaTaskStatus.TODO,
        priority:
          (data.priority as PrismaTaskPriority) ?? PrismaTaskPriority.MEDIUM,
        dueDate: data.dueDate ?? null,
      },
    });
    return this.toEntity(row);
  }

  async findManyByUserId(
    userId: string,
    filters?: TaskFilters,
  ): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: {
        userId,
        ...(filters?.projectId !== undefined && {
          projectId: filters.projectId,
        }),
        ...(filters?.status !== undefined && {
          status: filters.status as PrismaTaskStatus,
        }),
        ...(filters?.priority !== undefined && {
          priority: filters.priority as PrismaTaskPriority,
        }),
      },
      orderBy: [{ createdAt: "desc" }],
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Task | null> {
    const row = await this.prisma.task.findFirst({ where: { id, userId } });
    return row ? this.toEntity(row) : null;
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    data: UpdateTaskData,
  ): Promise<Task> {
    const row = await this.prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && {
          status: data.status as PrismaTaskStatus,
        }),
        ...(data.priority !== undefined && {
          priority: data.priority as PrismaTaskPriority,
        }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt,
        }),
        ...("projectId" in data && { projectId: data.projectId }),
      },
    });
    return this.toEntity(row);
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  async unassignByProjectId(projectId: string, userId: string): Promise<void> {
    await this.prisma.task.updateMany({
      where: { projectId, userId },
      data: { projectId: null },
    });
  }

  async findTodayByUserId(
    userId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: {
        userId,
        dueDate: { gte: dayStart, lte: dayEnd },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findUpcomingByUserId(userId: string, afterDate: Date): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: {
        userId,
        status: { not: PrismaTaskStatus.DONE },
        dueDate: { gt: afterDate },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 20,
    });
    return rows.map((r) => this.toEntity(r));
  }

  async countOpenByUserId(userId: string): Promise<number> {
    return this.prisma.task.count({
      where: { userId, status: { not: PrismaTaskStatus.DONE } },
    });
  }

  async countDueTodayByUserId(
    userId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<number> {
    return this.prisma.task.count({
      where: { userId, dueDate: { gte: dayStart, lte: dayEnd } },
    });
  }

  async countUpcomingByUserId(
    userId: string,
    afterDate: Date,
  ): Promise<number> {
    return this.prisma.task.count({
      where: {
        userId,
        status: { not: PrismaTaskStatus.DONE },
        dueDate: { gt: afterDate },
      },
    });
  }

  private toEntity(row: {
    id: string;
    userId: string;
    projectId: string | null;
    title: string;
    description: string | null;
    status: PrismaTaskStatus;
    priority: PrismaTaskPriority;
    dueDate: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return new Task(
      row.id,
      row.userId,
      row.projectId,
      row.title,
      row.description,
      row.status as unknown as TaskStatus,
      row.priority as unknown as TaskPriority,
      row.dueDate,
      row.completedAt,
      row.createdAt,
      row.updatedAt,
    );
  }
}
