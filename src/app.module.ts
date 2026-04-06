import { Module } from "@nestjs/common";
import { CoreConfigModule } from "./core/config/config.module";
import { DatabaseModule } from "./core/database/database.module";
import { EmailModule } from "./core/email/email.module";
import { HealthModule } from "./core/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProjectsModule } from "./modules/projects/projects.module";

@Module({
  imports: [
    CoreConfigModule,
    DatabaseModule,
    EmailModule,
    HealthModule,
    AuthModule,
    ProjectsModule,
  ],
})
export class AppModule {}
