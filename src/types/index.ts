export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  type?: string;
  data?: any;
  createdAt: string;
  pending?: boolean;
  error?: string;
}

export interface SessionContext {
  projectId?: string;
  sprintId?: string;
  teamId?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  updatedAt: string;
  context: SessionContext;
  messages?: Message[];
}

export interface Project {
  id: string;
  name: string;
}

export interface Sprint {
  id: string;
  name: string;
  projectId?: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface UserContext {
  userId: string;
  email: string;
  companyId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  projects: Project[];
  teams: Team[];
  sprints?: Sprint[];
}

export interface AssistantPayload {
  message: string;
  type?: string;
  data?: any;
}

/* Structured response data shapes (extensible) */
export interface TaskItem {
  id: string;
  title: string;
  status: string;
  assignee?: string;
}
export interface StoryItem {
  id: string;
  title: string;
  status: string;
  priority: string;
}
export interface SprintSummary {
  name: string;
  duration: string;
  progress: number;
  startDate?: string;
  endDate?: string;
}
export interface MetricsData {
  velocity?: number;
  completedTasks?: number;
  pendingTasks?: number;
  [key: string]: any;
}
