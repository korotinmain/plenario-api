import { ConflictException } from "@nestjs/common";
import { RegisterUserUseCase } from "./register-user.use-case";
import { IUserRepository } from "../../../users/domain/repositories/user.repository.interface";
import { IAuthAccountRepository } from "../../domain/repositories/auth-account.repository.interface";
import { IPasswordHasher } from "../../domain/services/password-hasher.interface";
import { User } from "../../../users/domain/user.entity";
import { AuthAccount, AuthProvider } from "../../domain/auth-account.entity";

const makeUser = (overrides: Partial<User> = {}): User =>
  new User(
    overrides.id ?? "user-1",
    overrides.email ?? "test@example.com",
    overrides.name ?? null,
    null,
    false,
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

describe("RegisterUserUseCase", () => {
  let useCase: RegisterUserUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let authAccountRepo: jest.Mocked<IAuthAccountRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;

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

    passwordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    useCase = new RegisterUserUseCase(
      userRepo,
      authAccountRepo,
      passwordHasher,
    );
  });

  it("creates user and auth account when email is not taken", async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue("argon2hash");
    userRepo.create.mockResolvedValue(makeUser());
    authAccountRepo.create.mockResolvedValue(makeAccount());

    const result = await useCase.execute({
      email: "Test@Example.com",
      password: "Password1",
      name: "Alice",
    });

    expect(result.requiresEmailConfirmation).toBe(true);
    expect(result.email).toBe("test@example.com");
    expect(userRepo.findByEmail).toHaveBeenCalledWith("test@example.com");
    expect(passwordHasher.hash).toHaveBeenCalledWith("Password1");
    expect(userRepo.create).toHaveBeenCalledWith({
      email: "test@example.com",
      name: "Alice",
    });
  });

  it("normalizes email to lowercase before lookup", async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue("hash");
    userRepo.create.mockResolvedValue(makeUser({ email: "upper@example.com" }));
    authAccountRepo.create.mockResolvedValue(makeAccount());

    await useCase.execute({
      email: "UPPER@EXAMPLE.COM",
      password: "Password1",
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith("upper@example.com");
  });

  it("throws ConflictException when email is already taken", async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser());

    await expect(
      useCase.execute({ email: "test@example.com", password: "Password1" }),
    ).rejects.toThrow(ConflictException);

    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it("does not log user in (no tokens returned)", async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue("hash");
    userRepo.create.mockResolvedValue(makeUser());
    authAccountRepo.create.mockResolvedValue(makeAccount());

    const result = await useCase.execute({
      email: "a@b.com",
      password: "Password1",
    });

    expect(result).not.toHaveProperty("accessToken");
    expect(result).not.toHaveProperty("refreshToken");
  });
});
