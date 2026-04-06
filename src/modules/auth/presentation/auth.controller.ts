import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { RegisterUserUseCase } from "../application/use-cases/register-user.use-case";
import { LoginUserUseCase } from "../application/use-cases/login-user.use-case";
import { GetCurrentUserUseCase } from "../application/use-cases/get-current-user.use-case";
import { LogoutUserUseCase } from "../application/use-cases/logout-user.use-case";
import { ConfirmEmailUseCase } from "../application/use-cases/confirm-email.use-case";
import { ResendEmailConfirmationUseCase } from "../application/use-cases/resend-email-confirmation.use-case";
import { ForgotPasswordUseCase } from "../application/use-cases/forgot-password.use-case";
import { ResetPasswordUseCase } from "../application/use-cases/reset-password.use-case";
import { LoginWithGoogleUseCase } from "../application/use-cases/login-with-google.use-case";
import { RefreshTokenUseCase } from "../application/use-cases/refresh-token.use-case";
import { RegisterRequestDto } from "./dtos/register-request.dto";
import { LoginRequestDto } from "./dtos/login-request.dto";
import { ConfirmEmailQueryDto } from "./dtos/confirm-email-query.dto";
import { ResendConfirmationRequestDto } from "./dtos/resend-confirmation-request.dto";
import { ForgotPasswordRequestDto } from "./dtos/forgot-password-request.dto";
import { ResetPasswordRequestDto } from "./dtos/reset-password-request.dto";
import { RefreshTokenRequestDto } from "./dtos/refresh-token-request.dto";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { GoogleAuthGuard } from "../../../core/auth/guards/google-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../../core/auth/decorators/current-user.decorator";
import { GoogleProfile } from "../../../core/auth/strategies/google.strategy";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly logoutUser: LogoutUserUseCase,
    private readonly confirmEmail: ConfirmEmailUseCase,
    private readonly resendEmailConfirmation: ResendEmailConfirmationUseCase,
    private readonly forgotPassword: ForgotPasswordUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
    private readonly loginWithGoogle: LoginWithGoogleUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly config: ConfigService,
  ) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterRequestDto) {
    return this.registerUser.execute({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
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
  logout(@CurrentUser() user: CurrentUserPayload) {
    return this.logoutUser.execute(user.userId);
  }

  @Get("confirm-email")
  @HttpCode(HttpStatus.OK)
  confirm(@Query() query: ConfirmEmailQueryDto) {
    return this.confirmEmail.execute({ token: query.token });
  }

  @Post("resend-confirmation")
  @HttpCode(HttpStatus.OK)
  resendConfirmation(@Body() dto: ResendConfirmationRequestDto) {
    return this.resendEmailConfirmation.execute({ email: dto.email });
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  forgot(@Body() dto: ForgotPasswordRequestDto) {
    return this.forgotPassword.execute({ email: dto.email });
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  reset(@Body() dto: ResetPasswordRequestDto) {
    return this.resetPassword.execute({
      token: dto.token,
      newPassword: dto.newPassword,
    });
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenRequestDto) {
    return this.refreshToken.execute({ refreshToken: dto.refreshToken });
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {
    // Passport redirects to Google — no body needed
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as GoogleProfile;
    const result = await this.loginWithGoogle.execute({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });

    const frontendUrl = this.config.get<string>("app.frontendUrl");
    const params = new URLSearchParams({
      accessToken: result.accessToken,
    });
    res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
  }
}
