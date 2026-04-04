import { IsString, IsNotEmpty } from "class-validator";

export class ConfirmEmailQueryDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
