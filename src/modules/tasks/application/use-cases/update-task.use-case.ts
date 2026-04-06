import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../domain/repositories/task.repository.interface";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../../projects/domain/repositories/project.repository.interface";
import { Task, TaskPriority, TaskStatus } from "../../domain/task.entity";

export interface UpdateTaskCommand {
  id: string;
  userId: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  projectId?: string | null;
}

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(command: UpdateTaskCommand): Promise<Task> {
    const existing = await this.taskRepo.findByIdAndUserId(
      command.id,
      command.userId,
    );
    if (!existing) {
      throw new NotFoundException({
        code: "TASK_NOT_FOUND",
        message: "Task not found",
      });
    }

    // Validate new projectId belongs to this user
    if (command.projectId !== undefined && command.projectId !== null) {
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

    // Enforce status/completedAt business rule
    const newStatus = command.status ?? existing.status;
    let completedAt: Date | null | undefined = undefined;

    if (command.status !== undefined) {
      if (
        command.status === TaskStatus.DONE &&
        existing.status !== TaskStatus.DONE
      ) {
        completedAt = new Date();
      } else if (
        command.status !== TaskStatus.DONE &&
        existing.status === TaskStatus.DONE
      ) {
        completedAt = null;
      }
    }

    return this.taskRepo.updateByIdAndUserId(command.id, command.userId, {
      title: command.title !== undefined ? command.title.trim() : undefined,
      description: command.description,
      status: newStatus,
      priority: command.priority,
      dueDate: command.dueDate,
      completedAt,
      projectId: command.projectId,
    });
  }
}
