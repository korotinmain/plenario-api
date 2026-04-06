import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { GetSettingsUseCase, GetSettingsResult } from "./get-settings.use-case";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import {
  IAuthAccountRepository,
  AUTH_ACCOUNT_REPOSITORY,
} from "../../../auth/domain/repositories/auth-account.repository.interface";
import { User } from "../../../users/domain/user.entity";
import {
  AuthAccount,
  AuthProvider,
} from "../../../auth/domain/auth-account.entity";

describe("GetSettingsUseCase", () => {
  let useCase: GetSettingsUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let authAccountRepo: jest.Mocked<IAuthAccountRepository>;

  const mockUser: User = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
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
    passwordHash: "hashed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetSettingsUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: AUTH_ACCOUNT_REPOSITORY,
          useValue: { findProvidersByUserId: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(GetSettingsUseCase);
    userRepo = module.get(USER_REPOSITORY);
    authAccountRepo = module.get(AUTH_ACCOUNT_REPOSITORY);
  });

  it("returns settings with providers list", async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    authAccountRepo.findProvidersByUserId.mockResolvedValue([mockAccount]);

    const result = await useCase.execute("user-1");

    expect(result).toEqual<GetSettingsResult>({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: null,
      timezone: "UTC",
      emailVerified: true,
      providers: ["CREDENTIALS"],
    });
  });

  it("throws NotFoundException when user does not exist", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing-id")).rejects.toThrow(
      NotFoundException,
    );
  });
});
