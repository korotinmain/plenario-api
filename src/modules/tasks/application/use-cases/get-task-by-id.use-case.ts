import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../domain/repositories/task.repository.interface";
import { Task } from "../../domain/task.entity";

@Injectable()
export class GetTaskByIdUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findByIdAndUserId(id, userId);
    if (!task) {
      throw new NotFoundException({
        code: "TASK_NOT_FOUND",
        message: "Task not found",
      });
    }
    return task;
  }
}
