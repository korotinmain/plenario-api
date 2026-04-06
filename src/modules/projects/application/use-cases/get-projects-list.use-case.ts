import { Inject, Injectable } from "@nestjs/common";
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from "../../domain/repositories/project.repository.interface";
import { Project } from "../../domain/project.entity";

@Injectable()
export class GetProjectsListUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(userId: string): Promise<Project[]> {
    return this.projectRepo.findManyByUserId(userId);
  }
}
