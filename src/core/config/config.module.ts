import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./app.config";
import authConfig from "./auth.config";
import databaseConfig from "./database.config";
import emailConfig from "./email.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, emailConfig],
      envFilePath: [".env"],
    }),
  ],
})
export class CoreConfigModule {}
