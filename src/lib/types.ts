export interface SubTask {
  text: string;
  done: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface Task {
  text: string;
  done: boolean;
  notes?: string;
  dueDate?: string;
  priority?: "high" | "med" | "low";
  subtasks: SubTask[];
  createdAt?: string;
  createdBy?: string;
  scope?: string;
  status?: string;
  updatedAt?: string;
  desc?: string;
}

export interface Phase {
  name: string;
  desc?: string;
  tasks: Task[];
  _open?: boolean;
}

export interface ProjectData {
  project: string;
  version: string;
  updatedAt: string | null;
  phases: Phase[];
  _profileSynced?: boolean;
}

export interface ProjectEntry {
  key: string;
  name: string;
  desc?: string;
}

export interface Registry {
  folder: string;
  projects: ProjectEntry[];
}

export interface ActivityEntry {
  type: "created" | "completed" | "edited" | "deleted" | "moved";
  text: string;
  project: string;
  time: string;
}

export interface Config {
  company: string;
  author: string;
  website: string;
  launched: boolean;
  skipped: boolean;
  theme?: string;
  lang?: string;
}

export type ViewName =
  | "dashboard"
  | "projects"
  | "project"
  | "checklist"
  | "tasks"
  | "activity"
  | "settings"
  | "wizard";

export type ToastKind = "success" | "error" | "info";

export type Lang = "en" | "ht" | "fr";

export interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
  undoFn?: () => void;
}
