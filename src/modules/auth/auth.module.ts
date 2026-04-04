import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuthController } from "./presentation/auth.controller";

import { RegisterUserUseCase } from "./application/use-cases/register-user.use-case";
import { LoginUserUseCase } from "./application/use-cases/login-user.use-case";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { LogoutUserUseCase } from "./application/use-cases/logout-user.use-case";

import { AUTH_ACCOUNT_REPOSITORY } from "./domain/repositories/auth-account.repository.interface";
import { PASSWORD_HASHER } from "./domain/services/password-hasher.interface";
import { JWT_TOKEN_SERVICE } from "./domain/services/jwt-token.interface";

import { PrismaAuthAccountRepository } from "./infrastructure/prisma-auth-account.repository";
import { ArgonPasswordHasher } from "./infrastructure/argon-password-hasher.service";
import { JwtTokenService } from "./infrastructure/jwt-token.service";

import { JwtStrategy } from "../../core/auth/strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    GetCurrentUserUseCase,
    LogoutUserUseCase,

    { provide: AUTH_ACCOUNT_REPOSITORY, useClass: PrismaAuthAccountRepository },
    { provide: PASSWORD_HASHER, useClass: ArgonPasswordHasher },
    { provide: JWT_TOKEN_SERVICE, useClass: JwtTokenService },

    JwtStrategy,
  ],
})
export class AuthModule {}
