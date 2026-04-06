import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../../core/auth/decorators/current-user.decorator";
import { GetDashboardSummaryUseCase } from "../application/use-cases/get-dashboard-summary.use-case";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly getDashboardSummary: GetDashboardSummaryUseCase,
  ) {}

  @Get("summary")
  summary(
    @CurrentUser() user: CurrentUserPayload,
    @Query("timezone") tz?: string,
  ) {
    return this.getDashboardSummary.execute(user.userId, tz ?? "UTC");
  }
}
