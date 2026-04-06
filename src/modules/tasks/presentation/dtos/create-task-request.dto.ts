import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { TaskPriority, TaskStatus } from "../../domain/task.entity";

export class CreateTaskRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}
