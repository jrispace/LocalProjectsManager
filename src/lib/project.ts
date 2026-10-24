import type { ProjectData, Phase, Task, SubTask } from "./types";
import { getProjectData, saveProjectData, deleteProjectData, getRegistry, saveRegistry, generateKey } from "./storage";
import { todayStr } from "./utils";

// ── Create ────────────────────────────────────────────────
export function createProject(name: string, desc: string): string {
  const key = generateKey();
  const reg = getRegistry();
  reg.projects.push({ key, name });
  saveRegistry(reg);

  const data: ProjectData = {
    project: name,
    version: "2.0",
    updatedAt: new Date().toISOString(),
    phases: [
      {
        name: "To Do",
        desc: desc || "Tasks to do",
        tasks: [],
        _open: true,
      },
      {
        name: "In Progress",
        desc: "Currently working on",
        tasks: [],
        _open: true,
      },
      {
        name: "Done",
        desc: "Completed tasks",
        tasks: [],
        _open: false,
      },
    ],
  };

  saveProjectData(key, data);
  return key;
}

// ── Read ──────────────────────────────────────────────────
export function getProject(key: string): ProjectData | null {
  return getProjectData(key);
}

export function getAllProjects() {
  return getRegistry().projects;
}

// ── Update ────────────────────────────────────────────────
export function updateProject(key: string, name: string, desc: string): void {
  const reg = getRegistry();
  const p = reg.projects.find((x) => x.key === key);
  if (p) {
    p.name = name;
    p.desc = desc;
    saveRegistry(reg);
  }
  const data = getProjectData(key);
  if (data) {
    data.project = name;
    saveProjectData(key, data);
  }
}

export function updateProjectName(key: string, name: string): void {
  const data = getProjectData(key);
  if (!data) return;
  data.project = name;
  saveProjectData(key, data);

  const reg = getRegistry();
  const p = reg.projects.find((x) => x.key === key);
  if (p) {
    p.name = name;
    saveRegistry(reg);
  }
}

// ── Delete ────────────────────────────────────────────────
export function deleteProject(key: string): void {
  deleteProjectData(key);
  const reg = getRegistry();
  reg.projects = reg.projects.filter((x) => x.key !== key);
  saveRegistry(reg);
}

// ── Duplicate ─────────────────────────────────────────────
export function duplicateProject(key: string, newName: string): string {
  const newKey = generateKey();
  const reg = getRegistry();
  const orig = reg.projects.find((x) => x.key === key);
  reg.projects.push({ key: newKey, name: newName });
  saveRegistry(reg);

  const data = getProjectData(key);
  if (data) {
    const clone: ProjectData = JSON.parse(JSON.stringify(data));
    clone.project = newName;
    saveProjectData(newKey, clone);
  }
  return newKey;
}

// ── Rename ────────────────────────────────────────────────
export function renameProject(key: string, newName: string): void {
  const reg = getRegistry();
  const p = reg.projects.find((x) => x.key === key);
  if (p) {
    p.name = newName;
    saveRegistry(reg);
  }
  const data = getProjectData(key);
  if (data) {
    data.project = newName;
    saveProjectData(key, data);
  }
}

// ── Phase operations ──────────────────────────────────────
export function addPhase(key: string, name: string, desc: string): void {
  const data = getProjectData(key);
  if (!data) return;
  data.phases.push({ name, desc, tasks: [], _open: true });
  saveProjectData(key, data);
}

export function deletePhase(key: string, phaseIdx: number): void {
  const data = getProjectData(key);
  if (!data || !data.phases[phaseIdx]) return;
  data.phases.splice(phaseIdx, 1);
  saveProjectData(key, data);
}

export function movePhase(key: string, phaseIdx: number, dir: number): void {
  const data = getProjectData(key);
  if (!data) return;
  const newIdx = phaseIdx + dir;
  if (newIdx < 0 || newIdx >= data.phases.length) return;
  const temp = data.phases[phaseIdx];
  data.phases[phaseIdx] = data.phases[newIdx];
  data.phases[newIdx] = temp;
  saveProjectData(key, data);
}

export function togglePhase(key: string, phaseIdx: number): void {
  const data = getProjectData(key);
  if (!data || !data.phases[phaseIdx]) return;
  data.phases[phaseIdx]._open = !data.phases[phaseIdx]._open;
  saveProjectData(key, data);
}

// ── Task operations ───────────────────────────────────────
export function addTask(key: string, phaseIdx: number, task: Task): void {
  const data = getProjectData(key);
  if (!data || !data.phases[phaseIdx]) return;
  data.phases[phaseIdx].tasks.push(task);
  saveProjectData(key, data);
}

export function toggleTask(key: string, phaseIdx: number, taskIdx: number): void {
  const data = getProjectData(key);
  if (!data) return;
  const t = data.phases[phaseIdx]?.tasks[taskIdx];
  if (!t) return;
  t.done = !t.done;
  t.updatedAt = new Date().toISOString();
  saveProjectData(key, data);
}

export function updateTask(key: string, phaseIdx: number, taskIdx: number, updates: Partial<Task>): void {
  const data = getProjectData(key);
  if (!data) return;
  const t = data.phases[phaseIdx]?.tasks[taskIdx];
  if (!t) return;
  Object.assign(t, updates, { updatedAt: new Date().toISOString() });
  saveProjectData(key, data);
}

export function deleteTask(key: string, phaseIdx: number, taskIdx: number): void {
  const data = getProjectData(key);
  if (!data) return;
  data.phases[phaseIdx]?.tasks.splice(taskIdx, 1);
  saveProjectData(key, data);
}

export function moveTask(
  key: string,
  fromPhase: number,
  fromTask: number,
  toPhase: number,
  toTask: number
): void {
  const data = getProjectData(key);
  if (!data) return;
  const t = data.phases[fromPhase]?.tasks.splice(fromTask, 1)[0];
  if (!t) return;
  data.phases[toPhase]?.tasks.splice(toTask, 0, t);
  saveProjectData(key, data);
}

// ── Subtask operations ────────────────────────────────────
export function toggleSubtask(
  key: string,
  phaseIdx: number,
  taskIdx: number,
  subIdx: number
): void {
  const data = getProjectData(key);
  if (!data) return;
  const t = data.phases[phaseIdx]?.tasks[taskIdx];
  if (!t || !t.subtasks[subIdx]) return;
  t.subtasks[subIdx].done = !t.subtasks[subIdx].done;
  t.updatedAt = new Date().toISOString();
  saveProjectData(key, data);
}

export function addSubtask(
  key: string,
  phaseIdx: number,
  taskIdx: number,
  sub: SubTask
): void {
  const data = getProjectData(key);
  if (!data) return;
  const t = data.phases[phaseIdx]?.tasks[taskIdx];
  if (!t) return;
  if (!t.subtasks) t.subtasks = [];
  t.subtasks.push(sub);
  t.updatedAt = new Date().toISOString();
  saveProjectData(key, data);
}

export function deleteSubtask(
  key: string,
  phaseIdx: number,
  taskIdx: number,
  subIdx: number
): void {
  const data = getProjectData(key);
  if (!data) return;
  const t = data.phases[phaseIdx]?.tasks[taskIdx];
  if (!t || !t.subtasks) return;
  t.subtasks.splice(subIdx, 1);
  t.updatedAt = new Date().toISOString();
  saveProjectData(key, data);
}

// ── Move task between phases (via dropdown) ───────────────
export function moveTaskToPhase(
  key: string,
  fromPhase: number,
  taskIdx: number,
  toPhase: number
): void {
  const data = getProjectData(key);
  if (!data) return;
  const t = data.phases[fromPhase]?.tasks.splice(taskIdx, 1)[0];
  if (!t) return;
  data.phases[toPhase].tasks.push(t);
  saveProjectData(key, data);
}
