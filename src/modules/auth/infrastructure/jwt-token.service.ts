import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  IJwtTokenService,
  TokenPair,
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
}
