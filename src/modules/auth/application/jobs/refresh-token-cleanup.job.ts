import { Injectable, Logger } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from "../../domain/repositories/refresh-token.repository.interface";

@Injectable()
export class RefreshTokenCleanupJob {
  private readonly logger = new Logger(RefreshTokenCleanupJob.name);

  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron(): Promise<void> {
    this.logger.log("Running expired refresh token cleanup");
    await this.refreshTokenRepo.deleteExpired();
    this.logger.log("Expired refresh token cleanup complete");
  }
}
