import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuthController } from "./presentation/auth.controller";

import { RegisterUserUseCase } from "./application/use-cases/register-user.use-case";
import { LoginUserUseCase } from "./application/use-cases/login-user.use-case";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { LogoutUserUseCase } from "./application/use-cases/logout-user.use-case";
import { ConfirmEmailUseCase } from "./application/use-cases/confirm-email.use-case";
import { ResendEmailConfirmationUseCase } from "./application/use-cases/resend-email-confirmation.use-case";
import { ForgotPasswordUseCase } from "./application/use-cases/forgot-password.use-case";
import { ResetPasswordUseCase } from "./application/use-cases/reset-password.use-case";

import { LoginWithGoogleUseCase } from "./application/use-cases/login-with-google.use-case";
import { RefreshTokenUseCase } from "./application/use-cases/refresh-token.use-case";
import { RefreshTokenCleanupJob } from "./application/jobs/refresh-token-cleanup.job";

import { AUTH_ACCOUNT_REPOSITORY } from "./domain/repositories/auth-account.repository.interface";
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from "./domain/repositories/email-verification-token.repository.interface";
import { PASSWORD_RESET_TOKEN_REPOSITORY } from "./domain/repositories/password-reset-token.repository.interface";
import { REFRESH_TOKEN_REPOSITORY } from "./domain/repositories/refresh-token.repository.interface";
import { PASSWORD_HASHER } from "./domain/services/password-hasher.interface";
import { JWT_TOKEN_SERVICE } from "./domain/services/jwt-token.interface";
import { TOKEN_GENERATOR } from "./domain/services/token-generator.interface";

import { PrismaAuthAccountRepository } from "./infrastructure/prisma-auth-account.repository";
import { PrismaEmailVerificationTokenRepository } from "./infrastructure/prisma-email-verification-token.repository";
import { PrismaPasswordResetTokenRepository } from "./infrastructure/prisma-password-reset-token.repository";
import { ArgonPasswordHasher } from "./infrastructure/argon-password-hasher.service";
import { JwtTokenService } from "./infrastructure/jwt-token.service";
import { CryptoTokenGenerator } from "./infrastructure/crypto-token-generator.service";
import { PrismaRefreshTokenRepository } from "./infrastructure/prisma-refresh-token.repository";

import { JwtStrategy } from "../../core/auth/strategies/jwt.strategy";
import { GoogleStrategy } from "../../core/auth/strategies/google.strategy";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({}),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    GetCurrentUserUseCase,
    LogoutUserUseCase,
    ConfirmEmailUseCase,
    ResendEmailConfirmationUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    LoginWithGoogleUseCase,
    RefreshTokenUseCase,
    RefreshTokenCleanupJob,

    { provide: AUTH_ACCOUNT_REPOSITORY, useClass: PrismaAuthAccountRepository },
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useClass: PrismaEmailVerificationTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository,
    },
    { provide: PASSWORD_HASHER, useClass: ArgonPasswordHasher },
    { provide: JWT_TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: TOKEN_GENERATOR, useClass: CryptoTokenGenerator },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },

    JwtStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
