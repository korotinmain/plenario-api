import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import appConfig from "./app.config";
import authConfig from "./auth.config";
import databaseConfig from "./database.config";
import emailConfig from "./email.config";

const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
  RESEND_API_KEY: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),
  APP_BASE_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().required(),
}).unknown(true);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, emailConfig],
      envFilePath: [".env.local", ".env"],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
  ],
})
export class CoreConfigModule {}
