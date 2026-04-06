import { Task, TaskPriority, TaskStatus } from "../task.entity";

export interface CreateTaskData {
  userId: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export interface UpdateTaskData {
  projectId?: string | null;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  completedAt?: Date | null;
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export const TASK_REPOSITORY = Symbol("TASK_REPOSITORY");

export interface ITaskRepository {
  create(data: CreateTaskData): Promise<Task>;
  findManyByUserId(userId: string, filters?: TaskFilters): Promise<Task[]>;
  findByIdAndUserId(id: string, userId: string): Promise<Task | null>;
  updateByIdAndUserId(
    id: string,
    userId: string,
    data: UpdateTaskData,
  ): Promise<Task>;
  deleteByIdAndUserId(id: string, userId: string): Promise<void>;
  unassignByProjectId(projectId: string, userId: string): Promise<void>;
  // Today: tasks with dueDate within the user's current calendar day
  findTodayByUserId(
    userId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<Task[]>;
  // Upcoming: non-done tasks with dueDate strictly after end of today
  findUpcomingByUserId(userId: string, afterDate: Date): Promise<Task[]>;
  countOpenByUserId(userId: string): Promise<number>;
  countDueTodayByUserId(
    userId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<number>;
  countUpcomingByUserId(userId: string, afterDate: Date): Promise<number>;
}
