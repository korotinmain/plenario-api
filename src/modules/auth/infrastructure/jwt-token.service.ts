import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  IJwtTokenService,
  TokenPair,
  RefreshTokenPayload,
} from "../domain/services/jwt-token.interface";

@Injectable()
export class JwtTokenService implements IJwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>("auth.jwtAccessSecret"),
        expiresIn: this.config.get<string>("auth.jwtAccessExpiresIn"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>("auth.jwtRefreshSecret"),
        expiresIn: this.config.get<string>("auth.jwtRefreshExpiresIn"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(token, {
        secret: this.config.get<string>("auth.jwtRefreshSecret"),
      });
      return { sub: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is invalid or expired",
      });
    }
  }
}
