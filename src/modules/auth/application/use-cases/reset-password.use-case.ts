import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash } from "crypto";
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from "../../domain/repositories/password-reset-token.repository.interface";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../domain/repositories/auth-account.repository.interface";
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from "../../domain/services/password-hasher.interface";
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from "../../domain/repositories/refresh-token.repository.interface";

export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepo: IPasswordResetTokenRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<{ message: string }> {
    const tokenHash = createHash("sha256").update(command.token).digest("hex");
    const record = await this.tokenRepo.findValidByTokenHash(tokenHash);

    if (!record || record.isExpired() || record.isUsed()) {
      throw new BadRequestException({
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "Invalid or expired reset token",
      });
    }

    const newPasswordHash = await this.passwordHasher.hash(command.newPassword);

    await this.authAccountRepo.updatePasswordHash(
      record.userId,
      newPasswordHash,
    );
    await this.tokenRepo.markUsed(record.id);
    await this.tokenRepo.invalidateUnusedForUser(record.userId);
    await this.refreshTokenRepo.deleteByUserId(record.userId);

    return { message: "Password has been reset successfully" };
  }
}
