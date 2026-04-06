import { NotFoundException } from "@nestjs/common";
import { GetProjectByIdUseCase } from "./get-project-by-id.use-case";
import { IProjectRepository } from "../../domain/repositories/project.repository.interface";
import { Project } from "../../domain/project.entity";

const makeProject = (): Project =>
  new Project(
    "proj-1",
    "user-1",
    "My Project",
    "A description",
    "#3b82f6",
    new Date(),
    new Date(),
  );

describe("GetProjectByIdUseCase", () => {
  let useCase: GetProjectByIdUseCase;
  let projectRepo: jest.Mocked<IProjectRepository>;

  beforeEach(() => {
    projectRepo = {
      create: jest.fn(),
      findManyByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
      countByUserId: jest.fn(),
    };
    useCase = new GetProjectByIdUseCase(projectRepo);
  });

  it("returns project when found", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(makeProject());
    const result = await useCase.execute("proj-1", "user-1");
    expect(result.id).toBe("proj-1");
  });

  it("throws NotFoundException when project not found", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(null);
    await expect(useCase.execute("proj-1", "user-2")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("passes both id and userId to repo (ownership check)", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(null);
    await useCase.execute("proj-1", "user-1").catch(() => {});
    expect(projectRepo.findByIdAndUserId).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
    );
  });
});
