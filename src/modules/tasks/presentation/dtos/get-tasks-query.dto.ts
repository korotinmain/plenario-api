import { IsEnum, IsOptional, IsString } from "class-validator";
import { TaskPriority, TaskStatus } from "../../domain/task.entity";

export class GetTasksQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}
