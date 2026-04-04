import { ForgotPasswordUseCase } from "./forgot-password.use-case";
import { IUserRepository } from "../../../users/domain/repositories/user.repository.interface";
import { IAuthAccountRepository } from "../../domain/repositories/auth-account.repository.interface";
import { IPasswordResetTokenRepository } from "../../domain/repositories/password-reset-token.repository.interface";
import { ITokenGenerator } from "../../domain/services/token-generator.interface";
import { IEmailService } from "../../../../core/email/email.interface";
import { User } from "../../../users/domain/user.entity";
import { AuthAccount, AuthProvider } from "../../domain/auth-account.entity";
import { PasswordResetToken } from "../../domain/password-reset-token.entity";

const makeUser = (): User =>
  new User(
    "user-1",
    "test@example.com",
    "Alice",
    null,
    true,
    "UTC",
    new Date(),
    new Date(),
  );

const makeAccount = (): AuthAccount =>
  new AuthAccount(
    "acc-1",
    "user-1",
    AuthProvider.CREDENTIALS,
    "test@example.com",
    "hash",
    new Date(),
    new Date(),
  );

const makeResetToken = (): PasswordResetToken =>
  new PasswordResetToken(
    "tok-1",
    "user-1",
    "hash",
    new Date(Date.now() + 3600000),
    null,
    new Date(),
  );

const SAFE_MESSAGE = "If an account with that email exists";

describe("ForgotPasswordUseCase", () => {
  let useCase: ForgotPasswordUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let authAccountRepo: jest.Mocked<IAuthAccountRepository>;
  let tokenRepo: jest.Mocked<IPasswordResetTokenRepository>;
  let tokenGenerator: jest.Mocked<ITokenGenerator>;
  let emailService: jest.Mocked<IEmailService>;
  const configService = {
    get: jest.fn().mockReturnValue("http://localhost:4200"),
  } as any;

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      markEmailVerified: jest.fn(),
    };
    authAccountRepo = {
      findCredentialsByEmail: jest.fn(),
      findByProviderAccount: jest.fn(),
      findProvidersByUserId: jest.fn(),
      create: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    tokenRepo = {
      create: jest.fn(),
      findValidByTokenHash: jest.fn(),
      markUsed: jest.fn(),
      invalidateUnusedForUser: jest.fn(),
    };
    tokenGenerator = {
      generate: jest
        .fn()
        .mockResolvedValue({ raw: "rawtoken", hash: "hashtoken" }),
    };
    emailService = {
      sendEmailConfirmation: jest.fn(),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ForgotPasswordUseCase(
      userRepo,
      authAccountRepo,
      tokenRepo,
      tokenGenerator,
      emailService,
      configService,
    );
  });

  it("sends reset email when credentials account exists", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(makeAccount());
    userRepo.findById.mockResolvedValue(makeUser());
    tokenRepo.create.mockResolvedValue(makeResetToken());

    const result = await useCase.execute({ email: "test@example.com" });

    expect(result.message).toContain(SAFE_MESSAGE);
    expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
      "test@example.com",
      "Alice",
      expect.stringContaining("rawtoken"),
    );
  });

  it("returns same safe message when account does not exist", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ email: "nobody@example.com" });

    expect(result.message).toContain(SAFE_MESSAGE);
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("response is identical whether email exists or not (non-enumerable)", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(null);
    const r1 = await useCase.execute({ email: "no@example.com" });

    authAccountRepo.findCredentialsByEmail.mockResolvedValue(makeAccount());
    userRepo.findById.mockResolvedValue(makeUser());
    tokenRepo.create.mockResolvedValue(makeResetToken());
    const r2 = await useCase.execute({ email: "test@example.com" });

    expect(r1.message).toBe(r2.message);
  });
});
