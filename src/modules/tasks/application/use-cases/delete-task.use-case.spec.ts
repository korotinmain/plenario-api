import { NotFoundException } from "@nestjs/common";
import { DeleteTaskUseCase } from "./delete-task.use-case";
import { ITaskRepository } from "../../domain/repositories/task.repository.interface";
import { Task, TaskStatus, TaskPriority } from "../../domain/task.entity";

const makeTask = (): Task =>
  new Task(
    "task-1",
    "user-1",
    null,
    "My Task",
    null,
    TaskStatus.TODO,
    TaskPriority.MEDIUM,
    null,
    null,
    new Date(),
    new Date(),
  );

describe("DeleteTaskUseCase", () => {
  let useCase: DeleteTaskUseCase;
  let taskRepo: jest.Mocked<ITaskRepository>;

  beforeEach(() => {
    taskRepo = {
      create: jest.fn(),
      findManyByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
      unassignByProjectId: jest.fn(),
      findTodayByUserId: jest.fn(),
      findUpcomingByUserId: jest.fn(),
      countOpenByUserId: jest.fn(),
      countDueTodayByUserId: jest.fn(),
      countUpcomingByUserId: jest.fn(),
    };
    useCase = new DeleteTaskUseCase(taskRepo);
  });

  it("throws NotFoundException when task not found", async () => {
    taskRepo.findByIdAndUserId.mockResolvedValue(null);
    await expect(useCase.execute("task-1", "user-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(taskRepo.deleteByIdAndUserId).not.toHaveBeenCalled();
  });

  it("deletes task and returns success message", async () => {
    taskRepo.findByIdAndUserId.mockResolvedValue(makeTask());
    taskRepo.deleteByIdAndUserId.mockResolvedValue();
    const result = await useCase.execute("task-1", "user-1");
    expect(taskRepo.deleteByIdAndUserId).toHaveBeenCalledWith(
      "task-1",
      "user-1",
    );
    expect(result.message).toBe("Task deleted successfully");
  });
});
