import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../domain/repositories/auth-account.repository.interface";

export interface GetCurrentUserResult {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  timezone: string;
  providers: string[];
}

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
  ) {}

  async execute(userId: string): Promise<GetCurrentUserResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const accounts = await this.authAccountRepo.findProvidersByUserId(userId);
    const providers = accounts.map((a) => a.provider as string);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      timezone: user.timezone,
      providers,
    };
  }
}
