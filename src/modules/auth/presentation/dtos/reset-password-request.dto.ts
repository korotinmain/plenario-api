import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

export class ResetPasswordRequestDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: "Password must contain at least one letter and one digit",
  })
  newPassword!: string;
}
