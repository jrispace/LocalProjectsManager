// Local Disk Database using File System Access API + IndexedDB
import type { ProjectData, Registry } from "./types";

const DB_NAME = "lpm-disk-db";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const DB_FILE = "jrispace-pm.db";

let dbHandle: FileSystemDirectoryHandle | null = null;
let fileHandle: FileSystemFileHandle | null = null;
let dbState: { registry: Registry; projects: Record<string, ProjectData> } | null = null;
let writeTimeout: ReturnType<typeof setTimeout> | null = null;

// ── IndexedDB for persisting directory handle ──────────────
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, "dir");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get("dir");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ── Connect to disk ───────────────────────────────────────
export async function connectDisk(): Promise<boolean> {
  if (dbHandle) return true;

  // Try auto-reconnect from IndexedDB
  const saved = await loadDirHandle();
  if (saved) {
    try {
      const perm = await saved.requestPermission({ mode: "readwrite" });
      if (perm === "granted") {
        dbHandle = saved;
        fileHandle = await dbHandle.getFileHandle(DB_FILE, { create: true });
        await loadFromDisk();
        return true;
      }
    } catch {
      // Permission denied or handle stale
    }
  }

  // Ask user to pick directory
  try {
    dbHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    await saveDirHandle(dbHandle);
    fileHandle = await dbHandle.getFileHandle(DB_FILE, { create: true });
    await loadFromDisk();
    return true;
  } catch {
    dbHandle = null;
    fileHandle = null;
    return false;
  }
}

export function isDiskConnected(): boolean {
  return dbHandle !== null;
}

export function getDiskFolder(): string {
  return dbHandle?.name || "";
}

// ── Read from disk ────────────────────────────────────────
async function loadFromDisk(): Promise<void> {
  if (!fileHandle) return;
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (text.trim()) {
      dbState = JSON.parse(text);
    }
  } catch {
    dbState = { registry: { folder: "", projects: [] }, projects: {} };
  }
}

// ── Write to disk (debounced) ─────────────────────────────
function scheduleWrite(): void {
  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(flushToDisk, 600);
}

async function flushToDisk(): Promise<void> {
  if (!fileHandle || !dbState) return;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(dbState, null, 2));
    await writable.close();
  } catch (e) {
    console.error("Disk write failed:", e);
  }
}

// ── Get/Set operations ────────────────────────────────────
export function getDiskRegistry(): Registry | null {
  return dbState?.registry || null;
}

export function saveDiskRegistry(reg: Registry): void {
  if (!dbState) dbState = { registry: { folder: "", projects: [] }, projects: {} };
  dbState.registry = reg;
  scheduleWrite();
}

export function getDiskProjectData(key: string): ProjectData | null {
  return dbState?.projects[key] || null;
}

export function saveDiskProjectData(key: string, data: ProjectData): void {
  if (!dbState) dbState = { registry: { folder: "", projects: [] }, projects: {} };
  dbState.projects[key] = data;
  scheduleWrite();
}

export function deleteDiskProjectData(key: string): void {
  if (!dbState) return;
  delete dbState.projects[key];
  scheduleWrite();
}

// ── Backup ────────────────────────────────────────────────
export async function backupDatabase(): Promise<string | null> {
  if (!fileHandle) return null;
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `jrispace-pm-backup-${timestamp}.db`;

    // Create backup file in same directory
    const backupHandle = await dbHandle!.getFileHandle(backupName, { create: true });
    const writable = await backupHandle.createWritable();
    await writable.write(text);
    await writable.close();

    return backupName;
  } catch (e) {
    console.error("Backup failed:", e);
    return null;
  }
}

// ── Restore ───────────────────────────────────────────────
export async function restoreDatabase(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.registry || !data.projects) {
      throw new Error("Invalid backup format");
    }

    dbState = data;

    if (fileHandle) {
      const writable = await fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
    }

    return true;
  } catch (e) {
    console.error("Restore failed:", e);
    return false;
  }
}

// ── Project folders ───────────────────────────────────────
export async function createProjectFolder(name: string): Promise<void> {
  if (!dbHandle) return;
  try {
    const safeName = name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "project";
    const folder = await dbHandle.getDirectoryHandle(safeName, { create: true });
    const checkFile = await folder.getFileHandle("checklist.json", { create: true });
    const writable = await checkFile.createWritable();
    await writable.write(JSON.stringify({ phases: [] }, null, 2));
    await writable.close();
  } catch (e) {
    console.error("Create project folder failed:", e);
  }
}

// ── Scan folder ───────────────────────────────────────────
export interface ScanResult {
  dir: string;
  projects: { name: string; key: string; checklist: any }[];
}

export async function scanFolder(): Promise<ScanResult> {
  const dirHandle = await window.showDirectoryPicker({ mode: "read" });
  const result: ScanResult = { dir: dirHandle.name, projects: [] };

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === "directory") {
      try {
        const dirHandle2 = handle as FileSystemDirectoryHandle;
        const checkFile = await dirHandle2.getFileHandle("checklist.json");
        const file = await checkFile.getFile();
        const text = await file.text();
        const checklist = JSON.parse(text);
        result.projects.push({
          name,
          key: "proj_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          checklist,
        });
      } catch {
        // No checklist.json in this folder
      }
    }
  }

  return result;
}

// ── Cleanup ───────────────────────────────────────────────
export function disconnectDisk(): void {
  dbHandle = null;
  fileHandle = null;
  dbState = null;
  if (writeTimeout) clearTimeout(writeTimeout);
}
