import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { RegisterUserUseCase } from "../application/use-cases/register-user.use-case";
import { LoginUserUseCase } from "../application/use-cases/login-user.use-case";
import { GetCurrentUserUseCase } from "../application/use-cases/get-current-user.use-case";
import { LogoutUserUseCase } from "../application/use-cases/logout-user.use-case";
import { RegisterRequestDto } from "./dtos/register-request.dto";
import { LoginRequestDto } from "./dtos/login-request.dto";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../../core/auth/decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly logoutUser: LogoutUserUseCase,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterRequestDto) {
    return this.registerUser.execute({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginRequestDto) {
    return this.loginUser.execute({
      email: dto.email,
      password: dto.password,
    });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: CurrentUserPayload) {
    return this.getCurrentUser.execute(user.userId);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout() {
    return this.logoutUser.execute();
  }
}
