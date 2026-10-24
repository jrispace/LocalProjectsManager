import type { Registry, ProjectData, ActivityEntry, Config } from "./types";

const KEYS = {
  REGISTRY: "jrispace.projects.v2",
  CONFIG: "jrispace.config.v1",
  ACTIVITY: "jrispace.activity.v1",
  CHECKLIST_PREFIX: "jrispace.checklist.v2.",
  THEME: "lpm.theme",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("localStorage write failed:", e);
  }
}

// ── Registry ──────────────────────────────────────────────
export function getRegistry(): Registry {
  return read<Registry>(KEYS.REGISTRY, { folder: "", projects: [] });
}

export function saveRegistry(r: Registry): void {
  write(KEYS.REGISTRY, r);
}

// ── Project data ──────────────────────────────────────────
export function getProjectData(key: string): ProjectData | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProjectData;
  } catch {
    return null;
  }
}

export function saveProjectData(key: string, data: ProjectData): void {
  data.updatedAt = new Date().toISOString();
  write(key, data);
}

export function deleteProjectData(key: string): void {
  localStorage.removeItem(key);
}

// ── Activity log ──────────────────────────────────────────
export function getActivity(): ActivityEntry[] {
  return read<ActivityEntry[]>(KEYS.ACTIVITY, []);
}

export function addActivity(entry: ActivityEntry): void {
  const list = getActivity();
  list.unshift(entry);
  if (list.length > 100) list.length = 100;
  write(KEYS.ACTIVITY, list);
}

// ── Config ────────────────────────────────────────────────
export function getConfig(): Config {
  return read<Config>(KEYS.CONFIG, {
    company: "",
    author: "",
    website: "",
    launched: false,
    skipped: false,
    theme: "dark",
    lang: "en",
  });
}

export function saveConfig(c: Config): void {
  write(KEYS.CONFIG, c);
}

// ── Checklist (per-project) ───────────────────────────────
export function getChecklist(projectKey: string): string[] {
  return read<string[]>(KEYS.CHECKLIST_PREFIX + projectKey, []);
}

export function saveChecklist(projectKey: string, items: string[]): void {
  write(KEYS.CHECKLIST_PREFIX + projectKey, items);
}

// ── Theme ─────────────────────────────────────────────────
export function getTheme(): string {
  return localStorage.getItem(KEYS.THEME) || "dark";
}

export function setTheme(t: string): void {
  localStorage.setItem(KEYS.THEME, t);
}

// ── Utility ───────────────────────────────────────────────
export function generateKey(): string {
  return "proj_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
