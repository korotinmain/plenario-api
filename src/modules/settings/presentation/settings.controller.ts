import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../../core/auth/decorators/current-user.decorator";
import { GetSettingsUseCase } from "../application/use-cases/get-settings.use-case";
import { UpdateProfileUseCase } from "../application/use-cases/update-profile.use-case";
import { ChangePasswordUseCase } from "../application/use-cases/change-password.use-case";
import { UpdateProfileRequestDto } from "./dtos/update-profile-request.dto";
import { ChangePasswordRequestDto } from "./dtos/change-password-request.dto";

@Controller("settings")
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly getSettings: GetSettingsUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Get()
  get(@CurrentUser() user: CurrentUserPayload) {
    return this.getSettings.execute(user.userId);
  }

  @Patch("profile")
  @HttpCode(HttpStatus.OK)
  profile(
    @Body() dto: UpdateProfileRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.updateProfile.execute({
      userId: user.userId,
      name: dto.name,
      avatarUrl: dto.avatarUrl,
      timezone: dto.timezone,
    });
  }

  @Patch("password")
  @HttpCode(HttpStatus.OK)
  password(
    @Body() dto: ChangePasswordRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.changePassword.execute({
      userId: user.userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }
}
