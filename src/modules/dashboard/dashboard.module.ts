import { Module } from "@nestjs/common";
import { DashboardController } from "./presentation/dashboard.controller";
import { GetDashboardSummaryUseCase } from "./application/use-cases/get-dashboard-summary.use-case";
import { ProjectsModule } from "../projects/projects.module";
import { TasksModule } from "../tasks/tasks.module";

@Module({
  imports: [ProjectsModule, TasksModule],
  controllers: [DashboardController],
  providers: [GetDashboardSummaryUseCase],
})
export class DashboardModule {}
