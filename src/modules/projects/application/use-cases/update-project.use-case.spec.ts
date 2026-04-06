import { NotFoundException } from "@nestjs/common";
import { UpdateProjectUseCase } from "./update-project.use-case";
import { IProjectRepository } from "../../domain/repositories/project.repository.interface";
import { Project } from "../../domain/project.entity";

const makeProject = (
  overrides: Partial<{
    name: string;
    description: string | null;
    color: string | null;
  }> = {},
): Project =>
  new Project(
    "proj-1",
    "user-1",
    overrides.name ?? "My Project",
    overrides.description ?? null,
    overrides.color ?? null,
    new Date(),
    new Date(),
  );

describe("UpdateProjectUseCase", () => {
  let useCase: UpdateProjectUseCase;
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
    useCase = new UpdateProjectUseCase(projectRepo);
  });

  it("throws NotFoundException when project does not exist or not owned", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(null);
    await expect(
      useCase.execute({ id: "proj-1", userId: "user-1", name: "New" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(projectRepo.updateByIdAndUserId).not.toHaveBeenCalled();
  });

  it("updates project when found", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(makeProject());
    const updated = makeProject({ name: "Updated" });
    projectRepo.updateByIdAndUserId.mockResolvedValue(updated);

    const result = await useCase.execute({
      id: "proj-1",
      userId: "user-1",
      name: "Updated",
    });

    expect(result.name).toBe("Updated");
    expect(projectRepo.updateByIdAndUserId).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      expect.objectContaining({ name: "Updated" }),
    );
  });

  it("trims whitespace from name", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(makeProject());
    projectRepo.updateByIdAndUserId.mockResolvedValue(
      makeProject({ name: "Trimmed" }),
    );

    await useCase.execute({
      id: "proj-1",
      userId: "user-1",
      name: "  Trimmed  ",
    });

    expect(projectRepo.updateByIdAndUserId).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      expect.objectContaining({ name: "Trimmed" }),
    );
  });

  it("allows setting description to null", async () => {
    projectRepo.findByIdAndUserId.mockResolvedValue(
      makeProject({ description: "old" }),
    );
    projectRepo.updateByIdAndUserId.mockResolvedValue(
      makeProject({ description: null }),
    );

    await useCase.execute({
      id: "proj-1",
      userId: "user-1",
      description: null,
    });

    expect(projectRepo.updateByIdAndUserId).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      expect.objectContaining({ description: null }),
    );
  });
});
