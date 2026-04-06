export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export class Task {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly projectId: string | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly status: TaskStatus,
    public readonly priority: TaskPriority,
    public readonly dueDate: Date | null,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
