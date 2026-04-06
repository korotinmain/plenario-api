import { ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
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
  IPasswordHasher,
  PASSWORD_HASHER,
} from "../../domain/services/password-hasher.interface";
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
import { AuthProvider } from "../../domain/auth-account.entity";

export interface RegisterUserCommand {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterUserResult {
  message: string;
  email: string;
  requiresEmailConfirmation: boolean;
}

@Injectable()
export class RegisterUserUseCase {
  private readonly confirmationTokenTtlMs = 24 * 60 * 60 * 1000; // 24h
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepo: IEmailVerificationTokenRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: ITokenGenerator,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    const normalizedEmail = command.email.toLowerCase().trim();

    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException({
        code: "EMAIL_ALREADY_IN_USE",
        message: "Email is already in use",
      });
    }

    const passwordHash = await this.passwordHasher.hash(command.password);

    const user = await this.userRepo.create({
      email: normalizedEmail,
      name: command.name,
    });

    await this.authAccountRepo.create({
      userId: user.id,
      provider: AuthProvider.CREDENTIALS,
      providerAccountId: normalizedEmail,
      passwordHash,
    });

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
      message: "Registration successful. Please confirm your email.",
      email: user.email,
      requiresEmailConfirmation: true,
    };
  }
}
