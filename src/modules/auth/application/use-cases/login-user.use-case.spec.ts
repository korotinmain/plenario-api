import { UnauthorizedException } from "@nestjs/common";
import { LoginUserUseCase } from "./login-user.use-case";
import { IUserRepository } from "../../../users/domain/repositories/user.repository.interface";
import { IAuthAccountRepository } from "../../domain/repositories/auth-account.repository.interface";
import { IPasswordHasher } from "../../domain/services/password-hasher.interface";
import { IJwtTokenService } from "../../domain/services/jwt-token.interface";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository.interface";
import { ConfigService } from "@nestjs/config";
import { User } from "../../../users/domain/user.entity";
import { AuthAccount, AuthProvider } from "../../domain/auth-account.entity";

const makeUser = (emailVerified = true): User =>
  new User(
    "user-1",
    "test@example.com",
    "Alice",
    null,
    emailVerified,
    "UTC",
    new Date(),
    new Date(),
  );

const makeAccount = (passwordHash: string | null = "hash"): AuthAccount =>
  new AuthAccount(
    "acc-1",
    "user-1",
    AuthProvider.CREDENTIALS,
    "test@example.com",
    passwordHash,
    new Date(),
    new Date(),
  );

describe("LoginUserUseCase", () => {
  let useCase: LoginUserUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let authAccountRepo: jest.Mocked<IAuthAccountRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let jwtTokenService: jest.Mocked<IJwtTokenService>;
  let refreshTokenRepo: jest.Mocked<IRefreshTokenRepository>;
  let configService: jest.Mocked<ConfigService>;

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

    passwordHasher = { hash: jest.fn(), verify: jest.fn() };
    jwtTokenService = {
      generateTokenPair: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    refreshTokenRepo = {
      create: jest.fn().mockResolvedValue(undefined),
      findByHash: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByHash: jest.fn(),
      deleteExpired: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue("7d"),
    } as unknown as jest.Mocked<ConfigService>;

    useCase = new LoginUserUseCase(
      userRepo,
      authAccountRepo,
      passwordHasher,
      jwtTokenService,
      refreshTokenRepo,
      configService,
    );
  });

  it("returns tokens and user on valid credentials", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(makeAccount());
    passwordHasher.verify.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue(makeUser(true));
    jwtTokenService.generateTokenPair.mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
    });

    const result = await useCase.execute({
      email: "test@example.com",
      password: "pass",
    });

    expect(result.accessToken).toBe("access");
    expect(result.refreshToken).toBe("refresh");
    expect(result.user.email).toBe("test@example.com");
  });

  it("throws UnauthorizedException when account not found", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: "no@one.com", password: "pass" }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws UnauthorizedException when password is invalid", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(makeAccount());
    passwordHasher.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: "test@example.com", password: "wrong" }),
    ).rejects.toThrow(UnauthorizedException);

    expect(jwtTokenService.generateTokenPair).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedException with EMAIL_NOT_VERIFIED when email not confirmed", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(makeAccount());
    passwordHasher.verify.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue(makeUser(false));

    await expect(
      useCase.execute({ email: "test@example.com", password: "pass" }),
    ).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({ code: "EMAIL_NOT_VERIFIED" }),
      }),
    );

    expect(jwtTokenService.generateTokenPair).not.toHaveBeenCalled();
  });

  it("normalizes email before lookup", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(makeAccount());
    passwordHasher.verify.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue(makeUser(true));
    jwtTokenService.generateTokenPair.mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
    });

    await useCase.execute({ email: "TEST@EXAMPLE.COM", password: "pass" });

    expect(authAccountRepo.findCredentialsByEmail).toHaveBeenCalledWith(
      "test@example.com",
    );
  });

  it("uses generic error message whether account missing or password wrong (non-enumerable)", async () => {
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(null);

    let err1: UnauthorizedException | undefined;
    try {
      await useCase.execute({ email: "x@x.com", password: "p" });
    } catch (e) {
      err1 = e as UnauthorizedException;
    }

    authAccountRepo.findCredentialsByEmail.mockResolvedValue(makeAccount());
    passwordHasher.verify.mockResolvedValue(false);

    let err2: UnauthorizedException | undefined;
    try {
      await useCase.execute({ email: "x@x.com", password: "wrong" });
    } catch (e) {
      err2 = e as UnauthorizedException;
    }

    const code1 = (err1?.getResponse() as { code: string })?.code;
    const code2 = (err2?.getResponse() as { code: string })?.code;
    expect(code1).toBe(code2);
  });
});
