import { NotFoundException } from "@nestjs/common";
import { CreateTaskUseCase } from "./create-task.use-case";
import { ITaskRepository } from "../../domain/repositories/task.repository.interface";
import { IProjectRepository } from "../../../projects/domain/repositories/project.repository.interface";
import { Task, TaskStatus, TaskPriority } from "../../domain/task.entity";
import { Project } from "../../../projects/domain/project.entity";

const makeTask = (): Task =>
  new Task(
    "t1",
    "u1",
    null,
    "Task",
    null,
    TaskStatus.TODO,
    TaskPriority.MEDIUM,
    null,
    null,
    new Date(),
    new Date(),
  );

const makeProject = (): Project =>
  new Project("p1", "u1", "Project", null, null, new Date(), new Date());

describe("CreateTaskUseCase", () => {
  let useCase: CreateTaskUseCase;
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
    useCase = new CreateTaskUseCase(taskRepo, projectRepo);
  });

  it("creates task without project", async () => {
    taskRepo.create.mockResolvedValue(makeTask());
    const result = await useCase.execute({ userId: "u1", title: "Task" });
    expect(taskRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1" }),
    );
    expect(result.id).toBe("t1");
  });

  it("validates project ownership when projectId is provided", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(makeProject());
    taskRepo.create.mockResolvedValue(makeTask());
    await useCase.execute({ userId: "u1", title: "Task", projectId: "p1" });
    expect(projectRepo.findByIdAndUserId).toHaveBeenCalledWith("p1", "u1");
  });

  it("throws NotFoundException when project not owned by user", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(null);
    await expect(
      useCase.execute({ userId: "u1", title: "Task", projectId: "not-mine" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(taskRepo.create).not.toHaveBeenCalled();
  });

  it("trims title whitespace", async () => {
    taskRepo.create.mockResolvedValue(makeTask());
    await useCase.execute({ userId: "u1", title: "  My Task  " });
    expect(taskRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "My Task" }),
    );
  });
});
