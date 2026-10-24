import type { Registry, ProjectData, ActivityEntry, Config, Phase, Task, SubTask, TaskComment } from "./types";
import {
  getDiskProjectData,
  getDiskRegistry,
  isDiskConnected,
  saveDiskProjectData,
  saveDiskRegistry,
  deleteDiskProjectData,
} from "./diskdb";

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

// ── Shape normalisation ───────────────────────────────────
// Projects reach us from several writers over time: the React app, the setup
// wizard's folder scan, an imported checklist.json and restored .db backups.
// They disagree on small things (missing subtasks array, phase flags, name
// field). Normalising on read keeps the UI from crashing and stops a shape
// mismatch from looking like "Project not found".
function normTask(raw: any): Task {
  const t = (raw && typeof raw === "object" ? raw : {}) as any;
  const subtasks: SubTask[] = (Array.isArray(t.subtasks) ? t.subtasks : []).map((s: any) => ({
    text: String(s?.text ?? ""),
    done: !!s?.done,
    createdBy: typeof s?.createdBy === "string" ? s.createdBy : undefined,
    createdAt: typeof s?.createdAt === "string" ? s.createdAt : undefined,
  }));
  const done = !!t.done;
  const rawStatus = typeof t.status === "string" ? t.status : "";
  const status: Task["status"] =
    rawStatus === "doing" || rawStatus === "inProgress" || rawStatus === "in-progress"
      ? "doing"
      : done || rawStatus === "done"
        ? "done"
        : "todo";
  const comments: TaskComment[] = (Array.isArray(t.comments) ? t.comments : []).map((c: any) => ({
    id: String(c?.id ?? `cm_${Math.random().toString(36).slice(2, 9)}`),
    text: String(c?.text ?? ""),
    at: typeof c?.at === "string" ? c.at : new Date().toISOString(),
    by: typeof c?.by === "string" ? c.by : undefined,
  }));
  return {
    id: typeof t.id === "string" && t.id ? t.id : `tk_${Math.random().toString(36).slice(2, 10)}`,
    text: String(t.text ?? ""),
    done: status === "done",
    notes: typeof t.notes === "string" ? t.notes : undefined,
    dueDate: typeof t.dueDate === "string" ? t.dueDate : undefined,
    priority: t.priority === "high" || t.priority === "med" || t.priority === "low" ? t.priority : undefined,
    status,
    assigneeId: typeof t.assigneeId === "string" ? t.assigneeId : undefined,
    tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
    comments,
    dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn.map(String) : [],
    subtasks,
    createdAt: typeof t.createdAt === "string" ? t.createdAt : undefined,
    createdBy: typeof t.createdBy === "string" ? t.createdBy : undefined,
    scope: typeof t.scope === "string" ? t.scope : undefined,
    updatedAt: typeof t.updatedAt === "string" ? t.updatedAt : undefined,
    desc: typeof t.desc === "string" ? t.desc : undefined,
  };
}

export function normalizeProjectData(raw: any, fallbackName = "Untitled project"): ProjectData | null {
  const src = raw && typeof raw === "object" ? raw : null;
  if (!src) return null;

  const phasesRaw: any[] | null = Array.isArray(src.phases)
    ? src.phases
    : Array.isArray(src.data?.phases)
      ? src.data.phases
      : Array.isArray(src.checklist?.phases)
        ? src.checklist.phases
        : null;
  if (!phasesRaw) return null;

  const phases: Phase[] = phasesRaw.map((p: any) => ({
    name: typeof p?.name === "string" && p.name ? p.name : "Phase",
    desc: typeof p?.desc === "string" ? p.desc : "",
    _open: p?._open !== false,
    tasks: (Array.isArray(p?.tasks) ? p.tasks : []).map(normTask),
  }));

  const name =
    (typeof src.project === "string" && src.project) ||
    (typeof src.name === "string" && src.name) ||
    fallbackName;

  return {
    project: name,
    version: typeof src.version === "string" ? src.version : "2.0",
    updatedAt: typeof src.updatedAt === "string" ? src.updatedAt : null,
    phases,
    _profileSynced: !!src._profileSynced,
  };
}

function registryName(key: string): string {
  const hit = getRegistryRaw().projects.find((p) => p.key === key);
  return hit?.name || "Untitled project";
}

// Tasks created before ids existed (or by the legacy app) get a generated id on
// read. That id must become permanent, otherwise dependencies, comments and the
// board would point at ids that change on every load.
function projectNeedsHeal(raw: any): boolean {
  const phases = raw?.phases ?? raw?.data?.phases ?? raw?.checklist?.phases;
  if (!Array.isArray(phases)) return true;
  for (const phase of phases) {
    const tasks = Array.isArray(phase?.tasks) ? phase.tasks : [];
    for (const task of tasks) {
      if (!task || typeof task.id !== "string" || !task.id) return true;
    }
  }
  return false;
}

// ── Registry ──────────────────────────────────────────────
function getRegistryRaw(): Registry {
  return read<Registry>(KEYS.REGISTRY, { folder: "", projects: [] });
}

export function getRegistry(): Registry {
  const local = getRegistryRaw();

  // A restored/connected disk database can hold projects this browser has
  // never seen. Merge them in (union by key) so nothing silently disappears.
  const disk = isDiskConnected() ? getDiskRegistry() : null;
  if (!disk || !Array.isArray(disk.projects)) return local;

  const byKey = new Map<string, { key: string; name: string; desc?: string }>();
  for (const p of local.projects || []) if (p?.key) byKey.set(p.key, p);
  for (const p of disk.projects) if (p?.key && !byKey.has(p.key)) byKey.set(p.key, p);

  const merged: Registry = {
    folder: local.folder || disk.folder || "",
    projects: [...byKey.values()],
  };

  if (merged.projects.length !== local.projects.length || merged.folder !== local.folder) {
    write(KEYS.REGISTRY, merged);
  }
  return merged;
}

export function saveRegistry(r: Registry): void {
  write(KEYS.REGISTRY, r);
  if (isDiskConnected()) saveDiskRegistry(r);
}

// ── Project data ──────────────────────────────────────────
// The canonical location is the registry key itself (`proj_xxx`). Older writers
// stored the payload under `jrispace.checklist.v2.<key>`, and a restored disk
// database keeps it in memory. Resolve all of them, then heal to the canonical
// key so the next read is a direct hit.
export function getProjectData(key: string): ProjectData | null {
  if (!key) return null;

  // Collect EVERY copy of this project (canonical key, legacy checklist key,
  // any storage key containing the project key, and the disk database), then
  // keep the richest one. A stale/empty canonical copy used to hide a project
  // that still had its real phases + tasks under the legacy key.
  const candidates: { source: string; storageKey: string; data: ProjectData }[] = [];

  const addCandidate = (source: string, storageKey: string, raw: unknown) => {
    const norm = normalizeProjectData(raw, registryName(key));
    if (norm) candidates.push({ source, storageKey, data: norm });
  };

  for (const storageKey of [key, KEYS.CHECKLIST_PREFIX + key]) {
    const raw = localStorage.getItem(storageKey);
    if (!raw) continue;
    try {
      addCandidate("local", storageKey, JSON.parse(raw));
    } catch {
      // not JSON — ignore
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey || storageKey === KEYS.REGISTRY) continue;
    if (!storageKey.includes(key)) continue;
    if (storageKey === key || storageKey === KEYS.CHECKLIST_PREFIX + key) continue;
    try {
      addCandidate("local-scan", storageKey, JSON.parse(localStorage.getItem(storageKey) || "null"));
    } catch {
      // not JSON — ignore
    }
  }

  if (isDiskConnected()) {
    const disk = getDiskProjectData(key);
    if (disk) addCandidate("disk", key, disk);
  }

  if (candidates.length === 0) return null;

  const score = (data: ProjectData) => {
    let tasks = 0;
    let subtasks = 0;
    for (const phase of data.phases) {
      tasks += phase.tasks.length;
      for (const task of phase.tasks) subtasks += (task.subtasks || []).length;
    }
    // Content wins over emptiness; phases count as a weak signal.
    return tasks * 100 + subtasks * 10 + data.phases.length;
  };

  candidates.sort((a, b) => {
    const diff = score(b.data) - score(a.data);
    if (diff !== 0) return diff;
    return String(b.data.updatedAt || "").localeCompare(String(a.data.updatedAt || ""));
  });

  const winner = candidates[0];
  const canonical = candidates.find((c) => c.storageKey === key);

  // Heal: promote the winner to the canonical key when the canonical copy is
  // missing, empty, or older, and when the payload still needs ids/shape fixes.
  const canonicalRaw = (() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const canonicalIsWinner = canonical && canonical.data === winner.data;
  const needsPromotion =
    winner.source !== "local" ||
    !canonical ||
    score(winner.data) > score(canonical.data) ||
    (canonicalRaw !== null && projectNeedsHeal(canonicalRaw));

  if (needsPromotion && !canonicalIsWinner) write(key, winner.data);
  else if (canonical && canonicalRaw !== null && projectNeedsHeal(canonicalRaw)) write(key, winner.data);

  return winner.data;
}

export function saveProjectData(key: string, data: ProjectData): void {
  data.updatedAt = new Date().toISOString();
  // Guarantee every task is addressable: stable id + full shape. Board drags,
  // comments and dependencies all reference tasks by id.
  for (const phase of data.phases || []) {
    if (!Array.isArray(phase.tasks)) phase.tasks = [];
    for (const task of phase.tasks) {
      if (!task.id) task.id = `tk_${Math.random().toString(36).slice(2, 10)}`;
      if (!task.status) task.status = task.done ? "done" : "todo";
      if (!Array.isArray(task.subtasks)) task.subtasks = [];
      if (!Array.isArray(task.comments)) task.comments = [];
      if (!Array.isArray(task.dependsOn)) task.dependsOn = [];
      if (!Array.isArray(task.tags)) task.tags = [];
    }
  }
  write(key, data);
  if (isDiskConnected()) saveDiskProjectData(key, data);
}

export function deleteProjectData(key: string): void {
  localStorage.removeItem(key);
  localStorage.removeItem(KEYS.CHECKLIST_PREFIX + key);
  if (isDiskConnected()) deleteDiskProjectData(key);
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
// The same key prefix can hold a scanned project payload instead of a plain
// item list — only arrays are valid checklists.
export function getChecklist(projectKey: string): string[] {
  const raw = read<unknown>(KEYS.CHECKLIST_PREFIX + projectKey, []);
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
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
