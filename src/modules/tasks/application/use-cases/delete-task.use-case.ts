import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../domain/repositories/task.repository.interface";

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(id: string, userId: string): Promise<{ message: string }> {
    const existing = await this.taskRepo.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException({
        code: "TASK_NOT_FOUND",
        message: "Task not found",
      });
    }
    await this.taskRepo.deleteByIdAndUserId(id, userId);
    return { message: "Task deleted successfully" };
  }
}
