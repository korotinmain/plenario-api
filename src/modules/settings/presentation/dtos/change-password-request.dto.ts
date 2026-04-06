import {
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsNotEmpty,
} from "class-validator";

export class ChangePasswordRequestDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: "Password must contain at least one letter and one digit",
  })
  newPassword!: string;
}
