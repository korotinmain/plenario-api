import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RefreshTokenUseCase } from "./refresh-token.use-case";
import {
  IJwtTokenService,
  TokenPair,
  RefreshTokenPayload,
} from "../../domain/services/jwt-token.interface";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository.interface";

const MOCK_REFRESH_TOKEN = "old.refresh.token";
const MOCK_ACCESS_TOKEN = "new.access.token";
const MOCK_NEW_REFRESH_TOKEN = "new.refresh.token";
const MOCK_USER_ID = "user-1";
const MOCK_EMAIL = "user@example.com";

const MOCK_PAYLOAD: RefreshTokenPayload = {
  sub: MOCK_USER_ID,
  email: MOCK_EMAIL,
};
const MOCK_NEW_PAIR: TokenPair = {
  accessToken: MOCK_ACCESS_TOKEN,
  refreshToken: MOCK_NEW_REFRESH_TOKEN,
};

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 3600 * 1000);

describe("RefreshTokenUseCase", () => {
  let useCase: RefreshTokenUseCase;
  let jwtTokenService: jest.Mocked<IJwtTokenService>;
  let refreshTokenRepo: jest.Mocked<IRefreshTokenRepository>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jwtTokenService = {
      generateTokenPair: jest.fn().mockResolvedValue(MOCK_NEW_PAIR),
      verifyRefreshToken: jest.fn().mockResolvedValue(MOCK_PAYLOAD),
    };

    refreshTokenRepo = {
      create: jest.fn().mockResolvedValue(undefined),
      findByHash: jest
        .fn()
        .mockResolvedValue({ userId: MOCK_USER_ID, expiresAt: FUTURE_DATE }),
      deleteByUserId: jest.fn().mockResolvedValue(undefined),
      deleteByHash: jest.fn().mockResolvedValue(undefined),
      deleteExpired: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      get: jest.fn().mockReturnValue("7d"),
    } as unknown as jest.Mocked<ConfigService>;

    useCase = new RefreshTokenUseCase(
      jwtTokenService,
      refreshTokenRepo,
      configService,
    );
  });

  it("rotates a valid refresh token and returns a new pair", async () => {
    const result = await useCase.execute({ refreshToken: MOCK_REFRESH_TOKEN });

    expect(result).toEqual(MOCK_NEW_PAIR);
    expect(jwtTokenService.verifyRefreshToken).toHaveBeenCalledWith(
      MOCK_REFRESH_TOKEN,
    );
    expect(refreshTokenRepo.findByHash).toHaveBeenCalledTimes(1);
    expect(refreshTokenRepo.deleteByHash).toHaveBeenCalledTimes(1);
    expect(refreshTokenRepo.create).toHaveBeenCalledTimes(1);
    expect(refreshTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: MOCK_USER_ID }),
    );
  });

  it("throws INVALID_REFRESH_TOKEN if token hash is not in the database", async () => {
    refreshTokenRepo.findByHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: MOCK_REFRESH_TOKEN }),
    ).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepo.deleteByHash).not.toHaveBeenCalled();
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
  });

  it("throws INVALID_REFRESH_TOKEN if stored token is already expired", async () => {
    refreshTokenRepo.findByHash.mockResolvedValue({
      userId: MOCK_USER_ID,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      useCase.execute({ refreshToken: MOCK_REFRESH_TOKEN }),
    ).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepo.deleteByHash).not.toHaveBeenCalled();
  });

  it("throws INVALID_REFRESH_TOKEN if JWT signature is invalid", async () => {
    jwtTokenService.verifyRefreshToken.mockRejectedValue(
      new UnauthorizedException({ code: "INVALID_REFRESH_TOKEN" }),
    );

    await expect(
      useCase.execute({ refreshToken: "bad.token" }),
    ).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepo.findByHash).not.toHaveBeenCalled();
  });
});
