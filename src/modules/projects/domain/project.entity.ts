export class Project {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly color: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
