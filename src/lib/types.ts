export interface SubTask {
  text: string;
  done: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface TaskComment {
  id: string;
  text: string;
  at: string;
  by?: string;
}

export interface Task {
  id?: string;
  text: string;
  done: boolean;
  notes?: string;
  dueDate?: string;
  priority?: "high" | "med" | "low";
  status?: "todo" | "doing" | "done";
  assigneeId?: string;
  tags?: string[];
  comments?: TaskComment[];
  dependsOn?: string[];
  subtasks: SubTask[];
  createdAt?: string;
  createdBy?: string;
  scope?: string;
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

// ── CRM ───────────────────────────────────────────────────
export interface Person {
  id: string;
  name: string;
  email?: string;
  color?: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  notes?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  companyId?: string;
  email?: string;
  phone?: string;
  role?: string;
  tags: string[];
  ownerId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export interface Deal {
  id: string;
  title: string;
  companyId?: string;
  contactId?: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedClose?: string;
  ownerId?: string;
  projectKey?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
}

export type CrmActivityType = "call" | "email" | "meeting" | "note" | "stage" | "created";

export interface CrmActivity {
  id: string;
  type: CrmActivityType;
  text: string;
  dealId?: string;
  contactId?: string;
  companyId?: string;
  at: string;
  by?: string;
}

export interface CrmState {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  activities: CrmActivity[];
  people: Person[];
}

export type ViewName =
  | "dashboard"
  | "projects"
  | "project"
  | "checklist"
  | "tasks"
  | "mytasks"
  | "crm"
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
