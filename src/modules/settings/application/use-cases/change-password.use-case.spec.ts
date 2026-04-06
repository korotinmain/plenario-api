import { Test } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ChangePasswordUseCase } from "./change-password.use-case";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../../auth/domain/repositories/auth-account.repository.interface";
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from "../../../auth/domain/services/password-hasher.interface";
import {
  REFRESH_TOKEN_REPOSITORY,
} from "../../../auth/domain/repositories/refresh-token.repository.interface";
import { User } from "../../../users/domain/user.entity";
import {
  AuthAccount,
  AuthProvider,
} from "../../../auth/domain/auth-account.entity";

describe("ChangePasswordUseCase", () => {
  let useCase: ChangePasswordUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let authAccountRepo: jest.Mocked<IAuthAccountRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;

  const mockUser: User = {
    id: "user-1",
    email: "test@example.com",
    name: null,
    avatarUrl: null,
    timezone: "UTC",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccount: AuthAccount = {
    id: "acct-1",
    userId: "user-1",
    provider: AuthProvider.CREDENTIALS,
    providerAccountId: "test@example.com",
    passwordHash: "hashed-old",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ChangePasswordUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: AUTH_ACCOUNT_REPOSITORY,
          useValue: {
            findCredentialsByEmail: jest.fn(),
            updatePasswordHash: jest.fn(),
          },
        },
        {
          provide: PASSWORD_HASHER,
          useValue: { verify: jest.fn(), hash: jest.fn() },
        },
        {
          provide: REFRESH_TOKEN_REPOSITORY,
          useValue: { deleteByUserId: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    useCase = module.get(ChangePasswordUseCase);
    userRepo = module.get(USER_REPOSITORY);
    authAccountRepo = module.get(AUTH_ACCOUNT_REPOSITORY);
    passwordHasher = module.get(PASSWORD_HASHER);
  });

  it("updates password when current password is correct", async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(mockAccount);
    passwordHasher.verify.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue("hashed-new");
    authAccountRepo.updatePasswordHash.mockResolvedValue();

    const result = await useCase.execute({
      userId: "user-1",
      currentPassword: "OldPass1",
      newPassword: "NewPass1",
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith("NewPass1");
    expect(authAccountRepo.updatePasswordHash).toHaveBeenCalledWith(
      "user-1",
      "hashed-new",
    );
    expect(result.message).toBeDefined();
  });

  it("throws BadRequestException when current password is wrong", async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(mockAccount);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        currentPassword: "WrongPass1",
        newPassword: "NewPass1",
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("throws NotFoundException when user does not exist", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "missing",
        currentPassword: "any",
        newPassword: "NewPass1",
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("throws BadRequestException when account has no password (OAuth-only user)", async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    authAccountRepo.findCredentialsByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        currentPassword: "any",
        newPassword: "NewPass1",
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
