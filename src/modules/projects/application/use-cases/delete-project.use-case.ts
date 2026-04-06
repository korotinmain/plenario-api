import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../domain/repositories/project.repository.interface";

@Injectable()
export class DeleteProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(id: string, userId: string): Promise<{ message: string }> {
    const existing = await this.projectRepo.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        message: "Project not found",
      });
    }

    await this.projectRepo.deleteByIdAndUserId(id, userId);
    return { message: "Project deleted successfully" };
  }
}
