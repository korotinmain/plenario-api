import { Module } from "@nestjs/common";
import { SettingsController } from "./presentation/settings.controller";
import { GetSettingsUseCase } from "./application/use-cases/get-settings.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";
import { ChangePasswordUseCase } from "./application/use-cases/change-password.use-case";
import { UsersModule } from "../users/users.module";
import { AUTH_ACCOUNT_REPOSITORY } from "../auth/domain/repositories/auth-account.repository.interface";
import { PASSWORD_HASHER } from "../auth/domain/services/password-hasher.interface";
import { REFRESH_TOKEN_REPOSITORY } from "../auth/domain/repositories/refresh-token.repository.interface";
import { PrismaAuthAccountRepository } from "../auth/infrastructure/prisma-auth-account.repository";
import { ArgonPasswordHasher } from "../auth/infrastructure/argon-password-hasher.service";
import { PrismaRefreshTokenRepository } from "../auth/infrastructure/prisma-refresh-token.repository";

@Module({
  imports: [UsersModule],
  controllers: [SettingsController],
  providers: [
    GetSettingsUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    { provide: AUTH_ACCOUNT_REPOSITORY, useClass: PrismaAuthAccountRepository },
    { provide: PASSWORD_HASHER, useClass: ArgonPasswordHasher },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
  ],
})
export class SettingsModule {}
