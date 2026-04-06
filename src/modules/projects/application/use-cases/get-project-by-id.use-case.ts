import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../domain/repositories/project.repository.interface";
import { Project } from "../../domain/project.entity";

@Injectable()
export class GetProjectByIdUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(id: string, userId: string): Promise<Project> {
    const project = await this.projectRepo.findByIdAndUserId(id, userId);
    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        message: "Project not found",
      });
    }
    return project;
  }
}
