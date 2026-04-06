import { NotFoundException } from "@nestjs/common";
import { DeleteProjectUseCase } from "./delete-project.use-case";
import { IProjectRepository } from "../../domain/repositories/project.repository.interface";
import { Project } from "../../domain/project.entity";

const makeProject = (): Project =>
  new Project(
    "proj-1",
    "user-1",
    "My Project",
    null,
    null,
    new Date(),
    new Date(),
  );

describe("DeleteProjectUseCase", () => {
  let useCase: DeleteProjectUseCase;
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
    useCase = new DeleteProjectUseCase(projectRepo);
  });

  it("throws NotFoundException when project not found or not owned", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(null);
    await expect(useCase.execute("proj-1", "user-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(projectRepo.deleteByIdAndUserId).not.toHaveBeenCalled();
  });

  it("deletes project and returns success message", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(makeProject());
    projectRepo.deleteByIdAndUserId.mockResolvedValue();

    const result = await useCase.execute("proj-1", "user-1");

    expect(projectRepo.deleteByIdAndUserId).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
    );
    expect(result.message).toBe("Project deleted successfully");
  });

  it("passes both id and userId to delete (ownership enforcement)", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(makeProject());
    projectRepo.deleteByIdAndUserId.mockResolvedValue();

    await useCase.execute("proj-1", "user-1");

    expect(projectRepo.deleteByIdAndUserId).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
    );
  });
});
