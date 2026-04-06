import { Module } from "@nestjs/common";
import { ProjectsController } from "./presentation/projects.controller";
import { CreateProjectUseCase } from "./application/use-cases/create-project.use-case";
import { GetProjectsListUseCase } from "./application/use-cases/get-projects-list.use-case";
import { GetProjectByIdUseCase } from "./application/use-cases/get-project-by-id.use-case";
import { UpdateProjectUseCase } from "./application/use-cases/update-project.use-case";
import { DeleteProjectUseCase } from "./application/use-cases/delete-project.use-case";
import { PROJECT_REPOSITORY } from "./domain/repositories/project.repository.interface";
import { PrismaProjectRepository } from "./infrastructure/prisma-project.repository";

@Module({
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    GetProjectsListUseCase,
    GetProjectByIdUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase,
    { provide: PROJECT_REPOSITORY, useClass: PrismaProjectRepository },
  ],
  exports: [PROJECT_REPOSITORY],
})
export class ProjectsModule {}
