import { Test } from "@nestjs/testing";
import {
  GetDashboardSummaryUseCase,
  DashboardSummary,
} from "./get-dashboard-summary.use-case";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../../tasks/domain/repositories/task.repository.interface";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../../projects/domain/repositories/project.repository.interface";
import {
  Task,
  TaskStatus,
  TaskPriority,
} from "../../../tasks/domain/task.entity";

describe("GetDashboardSummaryUseCase", () => {
  let useCase: GetDashboardSummaryUseCase;
  let taskRepo: jest.Mocked<ITaskRepository>;
  let projectRepo: jest.Mocked<IProjectRepository>;

  const mockTask: Task = new Task(
    "task-1",
    "user-1",
    null,
    "Task title",
    null,
    TaskStatus.TODO,
    TaskPriority.MEDIUM,
    new Date(),
    null,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetDashboardSummaryUseCase,
        {
          provide: PROJECT_REPOSITORY,
          useValue: { countByUserId: jest.fn() },
        },
        {
          provide: TASK_REPOSITORY,
          useValue: {
            countOpenByUserId: jest.fn(),
            countDueTodayByUserId: jest.fn(),
            countUpcomingByUserId: jest.fn(),
            findTodayByUserId: jest.fn(),
            findUpcomingByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(GetDashboardSummaryUseCase);
    taskRepo = module.get(TASK_REPOSITORY);
    projectRepo = module.get(PROJECT_REPOSITORY);
  });

  it("returns aggregated dashboard summary", async () => {
    projectRepo.countByUserId.mockResolvedValue(3);
    taskRepo.countOpenByUserId.mockResolvedValue(5);
    taskRepo.countDueTodayByUserId.mockResolvedValue(2);
    taskRepo.countUpcomingByUserId.mockResolvedValue(4);
    taskRepo.findTodayByUserId.mockResolvedValue([mockTask]);
    taskRepo.findUpcomingByUserId.mockResolvedValue([mockTask]);

    const result = await useCase.execute("user-1", "UTC");

    expect(result).toEqual<DashboardSummary>({
      totalProjects: 3,
      openTasks: 5,
      tasksDueToday: 2,
      upcomingTasks: 4,
      todayTasks: [mockTask],
      upcomingTasksPreview: [mockTask],
    });
  });

  it("fires all 6 queries in parallel (all repos called once)", async () => {
    projectRepo.countByUserId.mockResolvedValue(0);
    taskRepo.countOpenByUserId.mockResolvedValue(0);
    taskRepo.countDueTodayByUserId.mockResolvedValue(0);
    taskRepo.countUpcomingByUserId.mockResolvedValue(0);
    taskRepo.findTodayByUserId.mockResolvedValue([]);
    taskRepo.findUpcomingByUserId.mockResolvedValue([]);

    await useCase.execute("user-1", "Europe/Kyiv");

    expect(projectRepo.countByUserId).toHaveBeenCalledTimes(1);
    expect(taskRepo.countOpenByUserId).toHaveBeenCalledTimes(1);
    expect(taskRepo.countDueTodayByUserId).toHaveBeenCalledTimes(1);
    expect(taskRepo.countUpcomingByUserId).toHaveBeenCalledTimes(1);
    expect(taskRepo.findTodayByUserId).toHaveBeenCalledTimes(1);
    expect(taskRepo.findUpcomingByUserId).toHaveBeenCalledTimes(1);
  });

  it("returns zeros and empty arrays when user has no data", async () => {
    projectRepo.countByUserId.mockResolvedValue(0);
    taskRepo.countOpenByUserId.mockResolvedValue(0);
    taskRepo.countDueTodayByUserId.mockResolvedValue(0);
    taskRepo.countUpcomingByUserId.mockResolvedValue(0);
    taskRepo.findTodayByUserId.mockResolvedValue([]);
    taskRepo.findUpcomingByUserId.mockResolvedValue([]);

    const result = await useCase.execute("user-1", "UTC");

    expect(result.totalProjects).toBe(0);
    expect(result.todayTasks).toEqual([]);
    expect(result.upcomingTasksPreview).toEqual([]);
  });
});
