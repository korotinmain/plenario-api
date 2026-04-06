import { Test } from "@nestjs/testing";
import { GetTodayTasksUseCase } from "./get-today-tasks.use-case";
import {
  ITaskRepository,
  TASK_REPOSITORY,
} from "../../domain/repositories/task.repository.interface";
import { Task, TaskStatus, TaskPriority } from "../../domain/task.entity";

describe("GetTodayTasksUseCase", () => {
  let useCase: GetTodayTasksUseCase;
  let taskRepo: jest.Mocked<ITaskRepository>;

  const mockTask: Task = new Task(
    "task-1",
    "user-1",
    null,
    "Buy groceries",
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
        GetTodayTasksUseCase,
        {
          provide: TASK_REPOSITORY,
          useValue: { findTodayByUserId: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(GetTodayTasksUseCase);
    taskRepo = module.get(TASK_REPOSITORY);
  });

  it("returns today's tasks for the user", async () => {
    taskRepo.findTodayByUserId.mockResolvedValue([mockTask]);

    const result = await useCase.execute("user-1", "UTC");

    expect(taskRepo.findTodayByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.any(Date),
      expect.any(Date),
    );
    expect(result).toEqual([mockTask]);
  });

  it("passes timezone-correct UTC boundaries to the repository", async () => {
    taskRepo.findTodayByUserId.mockResolvedValue([]);

    await useCase.execute("user-1", "America/New_York");

    const [, dayStart, dayEnd] = taskRepo.findTodayByUserId.mock.calls[0];
    expect(dayStart.getTime()).toBeLessThan(dayEnd.getTime());
  });

  it("returns empty array when no tasks today", async () => {
    taskRepo.findTodayByUserId.mockResolvedValue([]);

    const result = await useCase.execute("user-1", "UTC");

    expect(result).toEqual([]);
  });
});
