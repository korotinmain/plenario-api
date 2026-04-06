import { Project } from "../project.entity";

export interface CreateProjectData {
  userId: string;
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  color?: string | null;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
}

export const PROJECT_REPOSITORY = Symbol("PROJECT_REPOSITORY");

export interface IProjectRepository {
  create(data: CreateProjectData): Promise<Project>;
  findManyByUserId(
    userId: string,
    filters?: ProjectFilters,
  ): Promise<Project[]>;
  findByIdAndUserId(id: string, userId: string): Promise<Project | null>;
  updateByIdAndUserId(
    id: string,
    userId: string,
    data: UpdateProjectData,
  ): Promise<Project>;
  deleteByIdAndUserId(id: string, userId: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}
