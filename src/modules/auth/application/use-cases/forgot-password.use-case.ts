import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../domain/repositories/auth-account.repository.interface";
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from "../../domain/repositories/password-reset-token.repository.interface";
import {
  ITokenGenerator,
  TOKEN_GENERATOR,
} from "../../domain/services/token-generator.interface";
import {
  IEmailService,
  EMAIL_SERVICE,
} from "../../../../core/email/email.interface";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";

export interface ForgotPasswordCommand {
  email: string;
}

const SAFE_RESPONSE = {
  message:
    "If an account with that email exists, a password reset link has been sent.",
};

@Injectable()
export class ForgotPasswordUseCase {
  private readonly resetTokenTtlMs = 60 * 60 * 1000; // 1h
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepo: IPasswordResetTokenRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: ITokenGenerator,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<{ message: string }> {
    const normalizedEmail = command.email.toLowerCase().trim();

    const account =
      await this.authAccountRepo.findCredentialsByEmail(normalizedEmail);

    // Always return same response — must not reveal email existence
    if (!account) {
      return SAFE_RESPONSE;
    }

    const user = await this.userRepo.findById(account.userId);
    if (!user) {
      return SAFE_RESPONSE;
    }

    await this.tokenRepo.invalidateUnusedForUser(user.id);

    const { raw, hash } = await this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + this.resetTokenTtlMs);

    await this.tokenRepo.create({
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    });

    const frontendUrl = this.config.get<string>("app.frontendUrl");
    const link = `${frontendUrl}/auth/reset-password?token=${raw}`;

    try {
      await this.emailService.sendPasswordReset(user.email, user.name, link);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to send password reset email to ${user.email}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return SAFE_RESPONSE;
  }
}
