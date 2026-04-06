import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import { User } from "../../../users/domain/user.entity";

export interface UpdateProfileCommand {
  userId: string;
  name?: string | null;
  avatarUrl?: string | null;
  timezone?: string;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<User> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    return this.userRepo.update(command.userId, {
      name:
        command.name !== undefined ? (command.name ?? undefined) : undefined,
      avatarUrl:
        command.avatarUrl !== undefined
          ? (command.avatarUrl ?? undefined)
          : undefined,
      timezone: command.timezone,
    });
  }
}
