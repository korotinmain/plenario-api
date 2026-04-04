export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string | null,
    public readonly avatarUrl: string | null,
    public readonly emailVerified: boolean,
    public readonly timezone: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
