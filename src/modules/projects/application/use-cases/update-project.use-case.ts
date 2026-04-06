import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../domain/repositories/project.repository.interface";
import { Project } from "../../domain/project.entity";

export interface UpdateProjectCommand {
  id: string;
  userId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
}

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(command: UpdateProjectCommand): Promise<Project> {
    const existing = await this.projectRepo.findByIdAndUserId(
      command.id,
      command.userId,
    );
    if (!existing) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        message: "Project not found",
      });
    }

    return this.projectRepo.updateByIdAndUserId(command.id, command.userId, {
      name: command.name !== undefined ? command.name.trim() : undefined,
      description:
        command.description !== undefined
          ? (command.description?.trim() ?? null)
          : undefined,
      color:
        command.color !== undefined
          ? (command.color?.trim() ?? null)
          : undefined,
    });
  }
}
