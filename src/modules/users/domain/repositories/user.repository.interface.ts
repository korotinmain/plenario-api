import { User } from "../user.entity";

export interface CreateUserData {
  email: string;
  name?: string;
  timezone?: string;
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string;
  timezone?: string;
}

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  markEmailVerified(userId: string): Promise<void>;
}
