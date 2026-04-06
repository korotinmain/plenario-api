import { Module } from "@nestjs/common";
import { TasksController } from "./presentation/tasks.controller";
import { CreateTaskUseCase } from "./application/use-cases/create-task.use-case";
import { GetTasksListUseCase } from "./application/use-cases/get-tasks-list.use-case";
import { GetTaskByIdUseCase } from "./application/use-cases/get-task-by-id.use-case";
import { UpdateTaskUseCase } from "./application/use-cases/update-task.use-case";
import { DeleteTaskUseCase } from "./application/use-cases/delete-task.use-case";
import { GetTodayTasksUseCase } from "./application/use-cases/get-today-tasks.use-case";
import { GetUpcomingTasksUseCase } from "./application/use-cases/get-upcoming-tasks.use-case";
import { TASK_REPOSITORY } from "./domain/repositories/task.repository.interface";
import { PrismaTaskRepository } from "./infrastructure/prisma-task.repository";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [ProjectsModule],
  controllers: [TasksController],
  providers: [
    CreateTaskUseCase,
    GetTasksListUseCase,
    GetTaskByIdUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
    GetTodayTasksUseCase,
    GetUpcomingTasksUseCase,
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
  ],
  exports: [TASK_REPOSITORY],
})
export class TasksModule {}
