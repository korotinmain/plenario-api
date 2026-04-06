import { Inject, Injectable } from "@nestjs/common";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../domain/repositories/task.repository.interface";
import { Task } from "../../domain/task.entity";
import { getTodayBoundaries } from "../../../../core/common/date-boundaries.util";

@Injectable()
export class GetUpcomingTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(userId: string, timezone: string): Promise<Task[]> {
    const { dayEnd } = getTodayBoundaries(timezone);
    return this.taskRepo.findUpcomingByUserId(userId, dayEnd);
  }
}
