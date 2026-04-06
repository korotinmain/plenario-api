import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class UpdateProfileRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim() ?? null)
  name?: string | null;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
