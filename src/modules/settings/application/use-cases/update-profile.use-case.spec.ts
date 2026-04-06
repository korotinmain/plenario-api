import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { UpdateProfileUseCase } from "./update-profile.use-case";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../users/domain/repositories/user.repository.interface";
import { User } from "../../../users/domain/user.entity";

describe("UpdateProfileUseCase", () => {
  let useCase: UpdateProfileUseCase;
  let userRepo: jest.Mocked<IUserRepository>;

  const mockUser: User = new User(
    "user-1",
    "test@example.com",
    "Test User",
    null,
    true,
    "UTC",
    new Date(),
    new Date(),
  );

  const updatedUser: User = new User(
    "user-1",
    "test@example.com",
    "New Name",
    "https://example.com/avatar.png",
    true,
    "America/New_York",
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateProfileUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: { findById: jest.fn(), update: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(UpdateProfileUseCase);
    userRepo = module.get(USER_REPOSITORY);
  });

  it("updates profile fields and returns updated user", async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute({
      userId: "user-1",
      name: "New Name",
      avatarUrl: "https://example.com/avatar.png",
      timezone: "America/New_York",
    });

    expect(userRepo.update).toHaveBeenCalledWith("user-1", {
      name: "New Name",
      avatarUrl: "https://example.com/avatar.png",
      timezone: "America/New_York",
    });
    expect(result).toEqual(updatedUser);
  });

  it("only passes defined fields to the repository", async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    await useCase.execute({ userId: "user-1", timezone: "Europe/London" });

    expect(userRepo.update).toHaveBeenCalledWith("user-1", {
      name: undefined,
      avatarUrl: undefined,
      timezone: "Europe/London",
    });
  });

  it("throws NotFoundException when user does not exist", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: "missing", name: "Test" }),
    ).rejects.toThrow(NotFoundException);
  });
});
