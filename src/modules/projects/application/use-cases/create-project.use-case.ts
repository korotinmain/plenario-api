import { Inject, Injectable } from "@nestjs/common";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../domain/repositories/project.repository.interface";
import { Project } from "../../domain/project.entity";

export interface CreateProjectCommand {
  userId: string;
  name: string;
  description?: string;
  color?: string;
}

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(command: CreateProjectCommand): Promise<Project> {
    return this.projectRepo.create({
      userId: command.userId,
      name: command.name.trim(),
      description: command.description?.trim(),
      color: command.color?.trim(),
    });
  }
}
