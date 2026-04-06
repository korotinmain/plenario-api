import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { LoggerModule } from "nestjs-pino";
import { APP_GUARD } from "@nestjs/core";
import { CoreConfigModule } from "./core/config/config.module";
import { DatabaseModule } from "./core/database/database.module";
import { EmailModule } from "./core/email/email.module";
import { HealthModule } from "./core/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { CorrelationIdMiddleware } from "./core/common/correlation-id.middleware";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== "production" ? "debug" : "info",
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true, singleLine: true } }
            : undefined,
        autoLogging: false,
        redact: ["req.headers.authorization"],
      },
    }),
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
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
