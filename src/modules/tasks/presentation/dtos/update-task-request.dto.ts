import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { TaskPriority, TaskStatus } from "../../domain/task.entity";

export class UpdateTaskRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  projectId?: string | null;
}
