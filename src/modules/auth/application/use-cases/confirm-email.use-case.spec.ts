import { BadRequestException } from "@nestjs/common";
import { ConfirmEmailUseCase } from "./confirm-email.use-case";
import { IEmailVerificationTokenRepository } from "../../domain/repositories/email-verification-token.repository.interface";
import { IUserRepository } from "../../../users/domain/repositories/user.repository.interface";
import { EmailVerificationToken } from "../../domain/email-verification-token.entity";
import { createHash } from "crypto";

const RAW_TOKEN = "abc123rawtoken";
const TOKEN_HASH = createHash("sha256").update(RAW_TOKEN).digest("hex");

const makeToken = (
  overrides: Partial<{
    expiresAt: Date;
    usedAt: Date | null;
  }> = {},
): EmailVerificationToken =>
  new EmailVerificationToken(
    "tok-1",
    "user-1",
    TOKEN_HASH,
    overrides.expiresAt ?? new Date(Date.now() + 86400000),
    overrides.usedAt ?? null,
    new Date(),
  );

describe("ConfirmEmailUseCase", () => {
  let useCase: ConfirmEmailUseCase;
  let tokenRepo: jest.Mocked<IEmailVerificationTokenRepository>;
  let userRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    tokenRepo = {
      create: jest.fn(),
      findValidByTokenHash: jest.fn(),
      markUsed: jest.fn(),
      invalidateUnusedForUser: jest.fn(),
    };
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      markEmailVerified: jest.fn(),
    };
    useCase = new ConfirmEmailUseCase(tokenRepo, userRepo);
  });

  it("confirms email and marks token used for valid token", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(makeToken());

    const result = await useCase.execute({ token: RAW_TOKEN });

    expect(result.message).toContain("confirmed");
    expect(tokenRepo.markUsed).toHaveBeenCalledWith("tok-1");
    expect(userRepo.markEmailVerified).toHaveBeenCalledWith("user-1");
  });

  it("hashes the raw token before lookup", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(makeToken());

    await useCase.execute({ token: RAW_TOKEN });

    expect(tokenRepo.findValidByTokenHash).toHaveBeenCalledWith(TOKEN_HASH);
  });

  it("throws BadRequestException when token not found", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(null);

    await expect(useCase.execute({ token: RAW_TOKEN })).rejects.toThrow(
      BadRequestException,
    );
    expect(userRepo.markEmailVerified).not.toHaveBeenCalled();
  });

  it("throws BadRequestException for expired token", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(
      makeToken({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(useCase.execute({ token: RAW_TOKEN })).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({ code: "INVALID_OR_EXPIRED_TOKEN" }),
      }),
    );
  });

  it("throws BadRequestException for already used token", async () => {
    tokenRepo.findValidByTokenHash.mockResolvedValue(
      makeToken({ usedAt: new Date() }),
    );

    await expect(useCase.execute({ token: RAW_TOKEN })).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({ code: "INVALID_OR_EXPIRED_TOKEN" }),
      }),
    );
  });
});
