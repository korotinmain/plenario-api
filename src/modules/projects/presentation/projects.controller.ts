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
import { CreateProjectUseCase } from "../application/use-cases/create-project.use-case";
import { GetProjectsListUseCase } from "../application/use-cases/get-projects-list.use-case";
import { GetProjectByIdUseCase } from "../application/use-cases/get-project-by-id.use-case";
import { UpdateProjectUseCase } from "../application/use-cases/update-project.use-case";
import { DeleteProjectUseCase } from "../application/use-cases/delete-project.use-case";
import { CreateProjectRequestDto } from "./dtos/create-project-request.dto";
import { UpdateProjectRequestDto } from "./dtos/update-project-request.dto";
import { GetProjectsQueryDto } from "./dtos/get-projects-query.dto";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly createProject: CreateProjectUseCase,
    private readonly getProjectsList: GetProjectsListUseCase,
    private readonly getProjectById: GetProjectByIdUseCase,
    private readonly updateProject: UpdateProjectUseCase,
    private readonly deleteProject: DeleteProjectUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateProjectRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.createProject.execute({
      userId: user.userId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
    });
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetProjectsQueryDto,
  ) {
    return this.getProjectsList.execute(user.userId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(":id")
  getOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.getProjectById.execute(id, user.userId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProjectRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.updateProject.execute({
      id,
      userId: user.userId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
    });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.deleteProject.execute(id, user.userId);
  }
}
