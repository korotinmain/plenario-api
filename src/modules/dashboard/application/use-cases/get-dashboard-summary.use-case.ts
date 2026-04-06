import { Inject, Injectable } from "@nestjs/common";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../../tasks/domain/repositories/task.repository.interface";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../../projects/domain/repositories/project.repository.interface";
import { Task } from "../../../tasks/domain/task.entity";
import { getTodayBoundaries } from "../../../../core/common/date-boundaries.util";

export interface DashboardSummary {
  totalProjects: number;
  openTasks: number;
  tasksDueToday: number;
  upcomingTasks: number;
  todayTasks: Task[];
  upcomingTasksPreview: Task[];
}

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
    @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(userId: string, timezone: string): Promise<DashboardSummary> {
    const { dayStart, dayEnd } = getTodayBoundaries(timezone);

    const [
      totalProjects,
      openTasks,
      tasksDueToday,
      upcomingTasks,
      todayTasks,
      upcomingTasksPreview,
    ] = await Promise.all([
      this.projectRepo.countByUserId(userId),
      this.taskRepo.countOpenByUserId(userId),
      this.taskRepo.countDueTodayByUserId(userId, dayStart, dayEnd),
      this.taskRepo.countUpcomingByUserId(userId, dayEnd),
      this.taskRepo.findTodayByUserId(userId, dayStart, dayEnd),
      this.taskRepo.findUpcomingByUserId(userId, dayEnd),
    ]);

    return {
      totalProjects,
      openTasks,
      tasksDueToday,
      upcomingTasks,
      todayTasks,
      upcomingTasksPreview,
    };
  }
}
