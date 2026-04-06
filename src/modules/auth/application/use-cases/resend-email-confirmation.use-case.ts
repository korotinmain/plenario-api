import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../domain/repositories/auth-account.repository.interface";
import {
  IEmailVerificationTokenRepository,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
} from "../../domain/repositories/email-verification-token.repository.interface";
import {
  ITokenGenerator,
  TOKEN_GENERATOR,
} from "../../domain/services/token-generator.interface";
import {
  IEmailService,
  EMAIL_SERVICE,
} from "../../../../core/email/email.interface";

export interface ResendEmailConfirmationCommand {
  email: string;
}

@Injectable()
export class ResendEmailConfirmationUseCase {
  private readonly confirmationTokenTtlMs = 24 * 60 * 60 * 1000; // 24h
  private readonly logger = new Logger(ResendEmailConfirmationUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepo: IEmailVerificationTokenRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: ITokenGenerator,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    command: ResendEmailConfirmationCommand,
  ): Promise<{ message: string }> {
    const normalizedEmail = command.email.toLowerCase().trim();

    const user = await this.userRepo.findByEmail(normalizedEmail);

    // Always return safe response to avoid user enumeration
    if (!user || user.emailVerified) {
      return {
        message:
          "If that email is registered and unconfirmed, a new confirmation email has been sent.",
      };
    }

    await this.tokenRepo.invalidateUnusedForUser(user.id);

    const { raw, hash } = await this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + this.confirmationTokenTtlMs);

    await this.tokenRepo.create({
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    });

    const frontendUrl = this.config.get<string>("app.frontendUrl");
    const link = `${frontendUrl}/auth/confirm-email?token=${raw}`;

    try {
      await this.emailService.sendEmailConfirmation(
        user.email,
        user.name,
        link,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to send confirmation email to ${user.email}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return {
      message:
        "If that email is registered and unconfirmed, a new confirmation email has been sent.",
    };
  }
}
