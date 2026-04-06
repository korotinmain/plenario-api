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
  IJwtTokenService,
  JWT_TOKEN_SERVICE,
  TokenPair,
} from "../../domain/services/jwt-token.interface";
import { AuthProvider } from "../../domain/auth-account.entity";
import { User } from "../../../users/domain/user.entity";

export interface LoginWithGoogleCommand {
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface LoginWithGoogleResult {
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
export class LoginWithGoogleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
    @Inject(JWT_TOKEN_SERVICE)
    private readonly jwtTokenService: IJwtTokenService,
  ) {}

  async execute(
    command: LoginWithGoogleCommand,
  ): Promise<LoginWithGoogleResult> {
    if (!command.email) {
      throw new UnauthorizedException({
        code: "GOOGLE_AUTH_FAILED",
        message: "Google account has no email address",
      });
    }

    const normalizedEmail = command.email.toLowerCase().trim();

    // Check for existing Google account
    const existingGoogleAccount =
      await this.authAccountRepo.findByProviderAccount(
        AuthProvider.GOOGLE,
        command.googleId,
      );

    let user: User;

    if (existingGoogleAccount) {
      // Already linked — load user
      const found = await this.userRepo.findById(existingGoogleAccount.userId);
      if (!found) {
        throw new UnauthorizedException({
          code: "GOOGLE_AUTH_FAILED",
          message: "User not found",
        });
      }
      user = found;
    } else {
      // No Google account yet — check if user exists by email
      const existingUser = await this.userRepo.findByEmail(normalizedEmail);

      if (existingUser) {
        // Safe link: attach Google account to existing user
        await this.authAccountRepo.create({
          userId: existingUser.id,
          provider: AuthProvider.GOOGLE,
          providerAccountId: command.googleId,
        });
        // Mark email verified since provider is trusted
        if (!existingUser.emailVerified) {
          await this.userRepo.markEmailVerified(existingUser.id);
        }
        user = existingUser;
      } else {
        // New user via Google
        user = await this.userRepo.create({
          email: normalizedEmail,
          name: command.name ?? undefined,
        });

        if (command.avatarUrl) {
          user = await this.userRepo.update(user.id, {
            avatarUrl: command.avatarUrl,
          });
        }

        await this.userRepo.markEmailVerified(user.id);

        await this.authAccountRepo.create({
          userId: user.id,
          provider: AuthProvider.GOOGLE,
          providerAccountId: command.googleId,
        });
      }
    }

    const tokens: TokenPair = await this.jwtTokenService.generateTokenPair(
      user.id,
      user.email,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        timezone: user.timezone,
      },
    };
  }
}
