import { BadRequestException } from "@nestjs/common";
import { ResetPasswordUseCase } from "./reset-password.use-case";
import { IPasswordResetTokenRepository } from "../../domain/repositories/password-reset-token.repository.interface";
import { IAuthAccountRepository } from "../../domain/repositories/auth-account.repository.interface";
import { IPasswordHasher } from "../../domain/services/password-hasher.interface";
import { PasswordResetToken } from "../../domain/password-reset-token.entity";
import { createHash } from "crypto";

const RAW_TOKEN = "resetrawtoken";
const TOKEN_HASH = createHash("sha256").update(RAW_TOKEN).digest("hex");

const makeToken = (
  overrides: Partial<{
    expiresAt: Date;
    usedAt: Date | null;
  }> = {},
): PasswordResetToken =>
  new PasswordResetToken(
    "tok-1",
    "user-1",
    TOKEN_HASH,
    overrides.expiresAt ?? new Date(Date.now() + 3600000),
    overrides.usedAt ?? null,
    new Date(),
  );

describe("ResetPasswordUseCase", () => {
  let useCase: ResetPasswordUseCase;
  let tokenRepo: jest.Mocked<IPasswordResetTokenRepository>;
  let authAccountRepo: jest.Mocked<IAuthAccountRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;

  beforeEach(() => {
    tokenRepo = {
      create: jest.fn(),
      findValidByTokenHash: jest.fn(),
      markUsed: jest.fn(),
      invalidateUnusedForUser: jest.fn(),
    };
    authAccountRepo = {
      findCredentialsByEmail: jest.fn(),
      findByProviderAccount: jest.fn(),
      findProvidersByUserId: jest.fn(),
      create: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    passwordHasher = { hash: jest.fn(), verify: jest.fn() };
    useCase = new ResetPasswordUseCase(
      tokenRepo,
      authAccountRepo,
      passwordHasher,
    );
  });

  it("resets password for valid token", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(makeToken());
    passwordHasher.hash.mockResolvedValue("newhash");

    const result = await useCase.execute({
      token: RAW_TOKEN,
      newPassword: "NewPass1",
    });

    expect(result.message).toContain("reset");
    expect(authAccountRepo.updatePasswordHash).toHaveBeenCalledWith(
      "user-1",
      "newhash",
    );
    expect(tokenRepo.markUsed).toHaveBeenCalledWith("tok-1");
    expect(tokenRepo.invalidateUnusedForUser).toHaveBeenCalledWith("user-1");
  });

  it("throws BadRequestException when token not found", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ token: RAW_TOKEN, newPassword: "NewPass1" }),
    ).rejects.toThrow(BadRequestException);

    expect(authAccountRepo.updatePasswordHash).not.toHaveBeenCalled();
  });

  it("throws BadRequestException for expired token", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(
      makeToken({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(
      useCase.execute({ token: RAW_TOKEN, newPassword: "NewPass1" }),
    ).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({ code: "INVALID_OR_EXPIRED_TOKEN" }),
      }),
    );
  });

  it("throws BadRequestException for already used token", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(
      makeToken({ usedAt: new Date() }),
    );

    await expect(
      useCase.execute({ token: RAW_TOKEN, newPassword: "NewPass1" }),
    ).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({ code: "INVALID_OR_EXPIRED_TOKEN" }),
      }),
    );
  });
});
