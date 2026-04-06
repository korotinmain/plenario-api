import { Inject, Injectable } from "@nestjs/common";
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from "../../domain/repositories/refresh-token.repository.interface";

@Injectable()
export class LogoutUserUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<{ message: string }> {
    await this.refreshTokenRepo.deleteByUserId(userId);
    return { message: "Logged out successfully" };
  }
}
