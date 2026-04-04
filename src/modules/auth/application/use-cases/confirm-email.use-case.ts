import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import {
  IEmailVerificationTokenRepository,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
} from "../../domain/repositories/email-verification-token.repository.interface";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";

export interface ConfirmEmailCommand {
  token: string;
}

@Injectable()
export class ConfirmEmailUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepo: IEmailVerificationTokenRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(command: ConfirmEmailCommand): Promise<{ message: string }> {
    const tokenHash = createHash("sha256").update(command.token).digest("hex");

    const record = await this.tokenRepo.findValidByTokenHash(tokenHash);

    if (!record) {
      throw new BadRequestException({
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "Invalid or expired confirmation token",
      });
    }

    if (record.isExpired()) {
      throw new BadRequestException({
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "Invalid or expired confirmation token",
      });
    }

    if (record.isUsed()) {
      throw new BadRequestException({
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "Invalid or expired confirmation token",
      });
    }

    await this.tokenRepo.markUsed(record.id);
    await this.userRepo.markEmailVerified(record.userId);

    return { message: "Email confirmed successfully" };
  }
}
