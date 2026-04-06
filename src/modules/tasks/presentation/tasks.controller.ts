import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../../core/auth/decorators/current-user.decorator";
import { CreateTaskUseCase } from "../application/use-cases/create-task.use-case";
import { GetTasksListUseCase } from "../application/use-cases/get-tasks-list.use-case";
import { GetTaskByIdUseCase } from "../application/use-cases/get-task-by-id.use-case";
import { UpdateTaskUseCase } from "../application/use-cases/update-task.use-case";
import { DeleteTaskUseCase } from "../application/use-cases/delete-task.use-case";
import { GetTodayTasksUseCase } from "../application/use-cases/get-today-tasks.use-case";
import { GetUpcomingTasksUseCase } from "../application/use-cases/get-upcoming-tasks.use-case";
import { CreateTaskRequestDto } from "./dtos/create-task-request.dto";
import { UpdateTaskRequestDto } from "./dtos/update-task-request.dto";
import { GetTasksQueryDto } from "./dtos/get-tasks-query.dto";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly getTasksList: GetTasksListUseCase,
    private readonly getTaskById: GetTaskByIdUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
    private readonly getTodayTasks: GetTodayTasksUseCase,
    private readonly getUpcomingTasks: GetUpcomingTasksUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateTaskRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.createTask.execute({
      userId: user.userId,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      projectId: dto.projectId,
    });
  }

  @Get("views/today")
  today(
    @CurrentUser() user: CurrentUserPayload,
    @Query("timezone") tz?: string,
  ) {
    return this.getTodayTasks.execute(user.userId, tz ?? "UTC");
  }

  @Get("views/upcoming")
  upcoming(
    @CurrentUser() user: CurrentUserPayload,
    @Query("timezone") tz?: string,
  ) {
    return this.getUpcomingTasks.execute(user.userId, tz ?? "UTC");
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetTasksQueryDto,
  ) {
    return this.getTasksList.execute(user.userId, {
      projectId: query.projectId,
      status: query.status,
      priority: query.priority,
    });
  }

  @Get(":id")
  getOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.getTaskById.execute(id, user.userId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.updateTask.execute({
      id,
      userId: user.userId,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      dueDate:
        dto.dueDate !== undefined
          ? dto.dueDate === null
            ? null
            : new Date(dto.dueDate)
          : undefined,
      projectId: dto.projectId,
    });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.deleteTask.execute(id, user.userId);
  }
}
