import { ConflictException, Inject, Injectable } from "@nestjs/common";
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
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
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

    return {
      message: "Registration successful. Please confirm your email.",
      email: user.email,
      requiresEmailConfirmation: true,
    };
  }
}
