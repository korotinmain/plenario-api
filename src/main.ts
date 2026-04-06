import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./core/errors/global-exception.filter";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const isDev = process.env.NODE_ENV !== "production";
  const app = await NestFactory.create(AppModule, {
    logger: isDev
      ? ["error", "warn", "log", "debug"]
      : ["error", "warn", "log"],
  });

  app.use(helmet());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
  logger.log(`Plenario API is running on port ${port}`);
}

bootstrap();
