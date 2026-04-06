import { NotFoundException } from "@nestjs/common";
import { UpdateTaskUseCase, UpdateTaskCommand } from "./update-task.use-case";
import { ITaskRepository } from "../../domain/repositories/task.repository.interface";
import { IProjectRepository } from "../../../projects/domain/repositories/project.repository.interface";
import { Task, TaskStatus, TaskPriority } from "../../domain/task.entity";
import { Project } from "../../../projects/domain/project.entity";

const makeTask = (
  overrides: Partial<{ status: TaskStatus; completedAt: Date | null }> = {},
): Task =>
  new Task(
    "task-1",
    "user-1",
    null,
    "My Task",
    null,
    overrides.status ?? TaskStatus.TODO,
    TaskPriority.MEDIUM,
    null,
    overrides.completedAt ?? null,
    new Date(),
    new Date(),
  );

const makeProject = (): Project =>
  new Project("proj-1", "user-1", "P", null, null, new Date(), new Date());

describe("UpdateTaskUseCase", () => {
  let useCase: UpdateTaskUseCase;
  let taskRepo: jest.Mocked<ITaskRepository>;
  let projectRepo: jest.Mocked<IProjectRepository>;

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
    projectRepo = {
      create: jest.fn(),
      findManyByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
      countByUserId: jest.fn(),
    };
    useCase = new UpdateTaskUseCase(taskRepo, projectRepo);
  });

  it("throws NotFoundException when task not found or not owned", async () => {
    taskRepo.findByIdAndUserId.mockResolvedValue(null);
    await expect(
      useCase.execute({ id: "task-1", userId: "user-1", title: "New" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(taskRepo.updateByIdAndUserId).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when projectId does not belong to user", async () => {
    taskRepo.findByIdAndUserId.mockResolvedValue(makeTask());
    projectRepo.findByIdAndUserId.mockResolvedValue(null);
    await expect(
      useCase.execute({
        id: "task-1",
        userId: "user-1",
        projectId: "other-proj",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("sets completedAt when status changes to DONE", async () => {
    taskRepo.findByIdAndUserId.mockResolvedValue(
      makeTask({ status: TaskStatus.TODO }),
    );
    const updated = makeTask({
      status: TaskStatus.DONE,
      completedAt: new Date(),
    });
    taskRepo.updateByIdAndUserId.mockResolvedValue(updated);

    await useCase.execute({
      id: "task-1",
      userId: "user-1",
      status: TaskStatus.DONE,
    });

    expect(taskRepo.updateByIdAndUserId).toHaveBeenCalledWith(
      "task-1",
      "user-1",
      expect.objectContaining({ completedAt: expect.any(Date) }),
    );
  });

  it("clears completedAt when status changes away from DONE", async () => {
    taskRepo.findByIdAndUserId.mockResolvedValue(
      makeTask({ status: TaskStatus.DONE, completedAt: new Date() }),
    );
    taskRepo.updateByIdAndUserId.mockResolvedValue(
      makeTask({ status: TaskStatus.TODO, completedAt: null }),
    );

    await useCase.execute({
      id: "task-1",
      userId: "user-1",
      status: TaskStatus.TODO,
    });

    expect(taskRepo.updateByIdAndUserId).toHaveBeenCalledWith(
      "task-1",
      "user-1",
      expect.objectContaining({ completedAt: null }),
    );
  });

  it("does not change completedAt when status is not updated", async () => {
    taskRepo.findByIdAndUserId.mockResolvedValue(
      makeTask({ status: TaskStatus.DONE, completedAt: new Date() }),
    );
    taskRepo.updateByIdAndUserId.mockResolvedValue(makeTask());

    await useCase.execute({
      id: "task-1",
      userId: "user-1",
      title: "New title",
    });

    const call = taskRepo.updateByIdAndUserId.mock.calls[0][2];
    expect(call.completedAt).toBeUndefined();
  });

  it("validates project ownership before updating", async () => {
    taskRepo.findByIdAndUserId.mockResolvedValue(makeTask());
    projectRepo.findByIdAndUserId.mockResolvedValue(makeProject());
    taskRepo.updateByIdAndUserId.mockResolvedValue(makeTask());

    await useCase.execute({
      id: "task-1",
      userId: "user-1",
      projectId: "proj-1",
    });

    expect(projectRepo.findByIdAndUserId).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
    );
  });
});
