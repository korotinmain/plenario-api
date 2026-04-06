import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../domain/repositories/task.repository.interface";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../../projects/domain/repositories/project.repository.interface";
import { Task, TaskPriority, TaskStatus } from "../../domain/task.entity";

export interface CreateTaskCommand {
  userId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  projectId?: string;
}

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(command: CreateTaskCommand): Promise<Task> {
    if (command.projectId) {
      const project = await this.projectRepo.findByIdAndUserId(
        command.projectId,
        command.userId,
      );
      if (!project) {
        throw new NotFoundException({
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        });
      }
    }

    return this.taskRepo.create({
      userId: command.userId,
      projectId: command.projectId ?? null,
      title: command.title.trim(),
      description: command.description?.trim() ?? null,
      status: command.status,
      priority: command.priority,
      dueDate: command.dueDate ?? null,
    });
  }
}
