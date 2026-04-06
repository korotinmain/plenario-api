import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../../auth/domain/repositories/auth-account.repository.interface";

export interface GetSettingsResult {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  timezone: string;
  emailVerified: boolean;
  providers: string[];
}

@Injectable()
export class GetSettingsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepo: IAuthAccountRepository,
  ) {}

  async execute(userId: string): Promise<GetSettingsResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }
    const accounts = await this.authAccountRepo.findProvidersByUserId(userId);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      emailVerified: user.emailVerified,
      providers: accounts.map((a) => a.provider),
    };
  }
}
