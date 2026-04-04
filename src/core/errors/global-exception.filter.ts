import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        code = this.statusToCode(status);
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, unknown>;
        code = (res["code"] as string) ?? this.statusToCode(status);
        message = (res["message"] as string) ?? message;
        details = res["details"];
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error("Unknown exception type", String(exception));
    }

    const body: ErrorResponse = {
      code,
      message,
      timestamp: new Date().toISOString(),
    };

    if (details !== undefined) {
      body.details = details;
    }

    this.logger.warn(`[${request.method}] ${request.url} → ${status} ${code}`);

    response.status(status).json(body);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
      429: "TOO_MANY_REQUESTS",
      500: "INTERNAL_ERROR",
    };
    return map[status] ?? "ERROR";
  }
}
