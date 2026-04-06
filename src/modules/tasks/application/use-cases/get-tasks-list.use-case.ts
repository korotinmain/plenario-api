import { Inject, Injectable } from "@nestjs/common";
import {
  ITaskRepository,
  TASK_REPOSITORY,
  TaskFilters,
} from "../../domain/repositories/task.repository.interface";
import { Task } from "../../domain/task.entity";

@Injectable()
export class GetTasksListUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(userId: string, filters?: TaskFilters): Promise<Task[]> {
    return this.taskRepo.findManyByUserId(userId, filters);
  }
}
