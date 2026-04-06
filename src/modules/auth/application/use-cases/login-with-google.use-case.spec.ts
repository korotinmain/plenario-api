import { UnauthorizedException } from "@nestjs/common";
import {
  LoginWithGoogleUseCase,
  LoginWithGoogleCommand,
} from "./login-with-google.use-case";
import { IUserRepository } from "../../../users/domain/repositories/user.repository.interface";
import { IAuthAccountRepository } from "../../domain/repositories/auth-account.repository.interface";
import { IJwtTokenService } from "../../domain/services/jwt-token.interface";
import { User } from "../../../users/domain/user.entity";
import { AuthAccount, AuthProvider } from "../../domain/auth-account.entity";

const makeUser = (): User =>
  new User(
    "user-1",
    "alice@example.com",
    "Alice",
    null,
    false,
    "UTC",
    new Date(),
    new Date(),
  );

const makeGoogleAccount = (): AuthAccount =>
  new AuthAccount(
    "acc-google",
    "user-1",
    AuthProvider.GOOGLE,
    "google-sub-123",
    null,
    new Date(),
    new Date(),
  );

const TOKENS = { accessToken: "at", refreshToken: "rt" };

const BASE_COMMAND: LoginWithGoogleCommand = {
  googleId: "google-sub-123",
  email: "alice@example.com",
  name: "Alice",
  avatarUrl: "https://example.com/avatar.png",
};

describe("LoginWithGoogleUseCase", () => {
  let useCase: LoginWithGoogleUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let authAccountRepo: jest.Mocked<IAuthAccountRepository>;
  let jwtTokenService: jest.Mocked<IJwtTokenService>;

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

    jwtTokenService = { generateTokenPair: jest.fn() };

    useCase = new LoginWithGoogleUseCase(
      userRepo,
      authAccountRepo,
      jwtTokenService,
    );
  });

  it("throws UnauthorizedException when email is empty", async () => {
    await expect(
      useCase.execute({ ...BASE_COMMAND, email: "" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("logs in existing Google-linked account", async () => {
    authAccountRepo.findByProviderAccount.mockResolvedValue(
      makeGoogleAccount(),
    );
    userRepo.findById.mockResolvedValue(makeUser());
    jwtTokenService.generateTokenPair.mockResolvedValue(TOKENS);

    const result = await useCase.execute(BASE_COMMAND);

    expect(authAccountRepo.findByProviderAccount).toHaveBeenCalledWith(
      AuthProvider.GOOGLE,
      "google-sub-123",
    );
    expect(userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(result.accessToken).toBe("at");
    expect(result.user.email).toBe("alice@example.com");
  });

  it("throws when Google account found but user is missing", async () => {
    authAccountRepo.findByProviderAccount.mockResolvedValue(
      makeGoogleAccount(),
    );
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(BASE_COMMAND)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("links Google account to existing email user and marks email verified", async () => {
    authAccountRepo.findByProviderAccount.mockResolvedValue(null);
    const existingUser = makeUser();
    userRepo.findByEmail.mockResolvedValue(existingUser);
    jwtTokenService.generateTokenPair.mockResolvedValue(TOKENS);

    const result = await useCase.execute(BASE_COMMAND);

    expect(authAccountRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ provider: AuthProvider.GOOGLE }),
    );
    expect(userRepo.markEmailVerified).toHaveBeenCalledWith(existingUser.id);
    expect(result.user.id).toBe("user-1");
  });

  it("does not call markEmailVerified when email already verified", async () => {
    authAccountRepo.findByProviderAccount.mockResolvedValue(null);
    const verifiedUser = new User(
      "user-1",
      "alice@example.com",
      "Alice",
      null,
      true,
      "UTC",
      new Date(),
      new Date(),
    );
    userRepo.findByEmail.mockResolvedValue(verifiedUser);
    jwtTokenService.generateTokenPair.mockResolvedValue(TOKENS);

    await useCase.execute(BASE_COMMAND);

    expect(userRepo.markEmailVerified).not.toHaveBeenCalled();
  });

  it("creates new user when no account or email match exists", async () => {
    authAccountRepo.findByProviderAccount.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);
    const newUser = makeUser();
    userRepo.create.mockResolvedValue(newUser);
    userRepo.update.mockResolvedValue({
      ...newUser,
      avatarUrl: BASE_COMMAND.avatarUrl,
    } as User);
    jwtTokenService.generateTokenPair.mockResolvedValue(TOKENS);

    const result = await useCase.execute(BASE_COMMAND);

    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "alice@example.com" }),
    );
    expect(userRepo.update).toHaveBeenCalledWith(
      newUser.id,
      expect.objectContaining({ avatarUrl: BASE_COMMAND.avatarUrl }),
    );
    expect(userRepo.markEmailVerified).toHaveBeenCalledWith(newUser.id);
    expect(authAccountRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: AuthProvider.GOOGLE,
        providerAccountId: "google-sub-123",
      }),
    );
    expect(result.user.id).toBe("user-1");
  });

  it("normalizes email to lowercase", async () => {
    authAccountRepo.findByProviderAccount.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);
    const user = makeUser();
    userRepo.create.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    jwtTokenService.generateTokenPair.mockResolvedValue(TOKENS);

    await useCase.execute({ ...BASE_COMMAND, email: "Alice@Example.COM" });

    expect(userRepo.findByEmail).toHaveBeenCalledWith("alice@example.com");
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "alice@example.com" }),
    );
  });
});
