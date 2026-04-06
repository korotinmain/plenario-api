import { createHash } from "crypto";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository.interface";

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

export async function storeRefreshToken(
  repo: IRefreshTokenRepository,
  userId: string,
  refreshToken: string,
  expiresIn: string,
): Promise<void> {
  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
  const expiresAt = new Date(Date.now() + parseDurationMs(expiresIn));
  await repo.create({ userId, tokenHash, expiresAt });
}
