import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import helmet from "helmet";
import * as compression from "compression";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./core/errors/global-exception.filter";

async function bootstrap(): Promise<void> {
  const isDev = process.env.NODE_ENV !== "production";
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Trust Railway's reverse proxy so real client IPs reach rate-limiter
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Plenario API")
      .setDescription("Plenario personal planning app — REST API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  app.get(Logger).log(`Plenario API is running on port ${port}`, "Bootstrap");
}

bootstrap();
