import { createHash } from "crypto";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import {
  IJwtTokenService,
  JWT_TOKEN_SERVICE,
  TokenPair,
} from "../../domain/services/jwt-token.interface";
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from "../../domain/repositories/refresh-token.repository.interface";
import { ConfigService } from "@nestjs/config";

export interface RefreshTokenCommand {
  refreshToken: string;
}

function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 3600 * 1000;
  const value = parseInt(match[1], 10);
  const unit: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * (unit[match[2]] ?? 86_400_000);
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(JWT_TOKEN_SERVICE)
    private readonly jwtTokenService: IJwtTokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokenPair> {
    // 1. Verify JWT signature and expiry
    const payload = await this.jwtTokenService.verifyRefreshToken(
      command.refreshToken,
    );

    // 2. Check hash is in the DB (not revoked)
    const tokenHash = createHash("sha256")
      .update(command.refreshToken)
      .digest("hex");
    const stored = await this.refreshTokenRepo.findByHash(tokenHash);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token has been revoked or expired",
      });
    }

    // 3. Rotate: delete old token, issue new pair, store new token
    await this.refreshTokenRepo.deleteByHash(tokenHash);
    const newPair = await this.jwtTokenService.generateTokenPair(
      payload.sub,
      payload.email,
    );

    const newHash = createHash("sha256")
      .update(newPair.refreshToken)
      .digest("hex");
    const expiresIn =
      this.config.get<string>("auth.jwtRefreshExpiresIn") ?? "7d";
    const expiresAt = new Date(Date.now() + parseDurationMs(expiresIn));
    await this.refreshTokenRepo.create({
      userId: payload.sub,
      tokenHash: newHash,
      expiresAt,
    });

    return newPair;
  }
}
