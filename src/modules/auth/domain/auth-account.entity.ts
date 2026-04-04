export enum AuthProvider {
  CREDENTIALS = "CREDENTIALS",
  GOOGLE = "GOOGLE",
}

export class AuthAccount {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: AuthProvider,
    public readonly providerAccountId: string,
    public readonly passwordHash: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
