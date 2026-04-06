import { Module } from "@nestjs/common";
import { CoreConfigModule } from "./core/config/config.module";
import { DatabaseModule } from "./core/database/database.module";
import { EmailModule } from "./core/email/email.module";
import { HealthModule } from "./core/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { SettingsModule } from "./modules/settings/settings.module";

@Module({
  imports: [
    CoreConfigModule,
    DatabaseModule,
    EmailModule,
    HealthModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    DashboardModule,
    SettingsModule,
  ],
})
export class AppModule {}
