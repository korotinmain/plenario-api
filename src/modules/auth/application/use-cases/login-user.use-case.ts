import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../domain/repositories/auth-account.repository.interface";
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from "../../domain/services/password-hasher.interface";
import {
  IJwtTokenService,
  JWT_TOKEN_SERVICE,
  TokenPair,
} from "../../domain/services/jwt-token.interface";
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from "../../domain/repositories/refresh-token.repository.interface";
import { storeRefreshToken } from "../helpers/store-refresh-token.helper";
import { ConfigService } from "@nestjs/config";
import { User } from "../../../users/domain/user.entity";

export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginUserResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    timezone: string;
  };
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(JWT_TOKEN_SERVICE)
    private readonly jwtTokenService: IJwtTokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const normalizedEmail = command.email.toLowerCase().trim();

    const account =
      await this.authAccountRepo.findCredentialsByEmail(normalizedEmail);
    if (!account || !account.passwordHash) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }

    const passwordValid = await this.passwordHasher.verify(
      command.password,
      account.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }

    const user = await this.userRepo.findById(account.userId);
    if (!user) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException({
        code: "EMAIL_NOT_VERIFIED",
        message: "Please confirm your email before logging in",
      });
    }

    const tokens: TokenPair = await this.jwtTokenService.generateTokenPair(
      user.id,
      user.email,
    );

    const expiresIn =
      this.config.get<string>("auth.jwtRefreshExpiresIn") ?? "7d";
    await storeRefreshToken(
      this.refreshTokenRepo,
      user.id,
      tokens.refreshToken,
      expiresIn,
    );

    return {
      ...tokens,
      user: this.toUserShape(user),
    };
  }

  private toUserShape(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      timezone: user.timezone,
    };
  }
}
