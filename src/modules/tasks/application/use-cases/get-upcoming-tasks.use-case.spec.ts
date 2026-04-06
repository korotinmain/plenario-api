import { Test } from "@nestjs/testing";
import { GetUpcomingTasksUseCase } from "./get-upcoming-tasks.use-case";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../domain/repositories/task.repository.interface";
import { Task, TaskStatus, TaskPriority } from "../../domain/task.entity";

describe("GetUpcomingTasksUseCase", () => {
  let useCase: GetUpcomingTasksUseCase;
  let taskRepo: jest.Mocked<ITaskRepository>;

  const mockTask: Task = new Task(
    "task-1",
    "user-1",
    null,
    "Plan sprint",
    null,
    TaskStatus.TODO,
    TaskPriority.HIGH,
    new Date(Date.now() + 86400_000 * 3), // 3 days from now
    null,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetUpcomingTasksUseCase,
        {
          provide: TASK_REPOSITORY,
          useValue: { findUpcomingByUserId: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(GetUpcomingTasksUseCase);
    taskRepo = module.get(TASK_REPOSITORY);
  });

  it("returns upcoming tasks for the user", async () => {
    taskRepo.findUpcomingByUserId.mockResolvedValue([mockTask]);

    const result = await useCase.execute("user-1", "UTC");

    expect(taskRepo.findUpcomingByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.any(Date),
    );
    expect(result).toEqual([mockTask]);
  });

  it("passes the end-of-today boundary as the afterDate", async () => {
    taskRepo.findUpcomingByUserId.mockResolvedValue([]);

    await useCase.execute("user-1", "UTC");

    const [, afterDate] = taskRepo.findUpcomingByUserId.mock.calls[0];
    // afterDate should be roughly end of today (within 24 hours from now)
    const diff = afterDate.getTime() - Date.now();
    expect(diff).toBeGreaterThanOrEqual(0);
    expect(diff).toBeLessThanOrEqual(86400_000);
  });

  it("returns empty array when no upcoming tasks", async () => {
    taskRepo.findUpcomingByUserId.mockResolvedValue([]);

    const result = await useCase.execute("user-1", "UTC");

    expect(result).toEqual([]);
  });
});
