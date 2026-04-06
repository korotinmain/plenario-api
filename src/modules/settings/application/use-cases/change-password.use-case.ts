import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../../auth/domain/repositories/auth-account.repository.interface";
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from "../../../auth/domain/services/password-hasher.interface";
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from "../../../auth/domain/repositories/refresh-token.repository.interface";

export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<{ message: string }> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    const account = await this.authAccountRepo.findCredentialsByEmail(
      user.email,
    );
    if (!account || !account.passwordHash) {
      throw new BadRequestException({
        code: "NO_PASSWORD_AUTH",
        message: "This account does not use password authentication",
      });
    }

    const valid = await this.passwordHasher.verify(
      command.currentPassword,
      account.passwordHash,
    );
    if (!valid) {
      throw new BadRequestException({
        code: "CURRENT_PASSWORD_INVALID",
        message: "Current password is incorrect",
      });
    }

    const newHash = await this.passwordHasher.hash(command.newPassword);
    await this.authAccountRepo.updatePasswordHash(command.userId, newHash);
    await this.refreshTokenRepo.deleteByUserId(command.userId);

    return { message: "Password updated successfully" };
  }
}
