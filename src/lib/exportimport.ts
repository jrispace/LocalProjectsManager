import type { Registry, ProjectData } from "./types";
import { getRegistry, saveRegistry, getProjectData, saveProjectData } from "./storage";

export interface ExportedProject {
  version: 2;
  exportedAt: string;
  registry: Registry;
  projects: Record<string, ProjectData>;
}

export function exportProjectJSON(projectKey: string): string | null {
  const reg = getRegistry();
  const proj = reg.projects.find((p) => p.key === projectKey);
  if (!proj) return null;

  const data = getProjectData(projectKey);
  if (!data) return null;

  const exported: ExportedProject = {
    version: 2,
    exportedAt: new Date().toISOString(),
    registry: { folder: reg.folder, projects: [proj] },
    projects: { [projectKey]: data },
  };

  return JSON.stringify(exported, null, 2);
}

export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProjectJSON(file: File): Promise<{ success: boolean; name?: string; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as ExportedProject;
        if (parsed.version !== 2 || !parsed.registry || !parsed.projects) {
          resolve({ success: false, error: "Invalid format" });
          return;
        }

        const reg = getRegistry();

        for (const proj of parsed.registry.projects) {
          // Avoid duplicates
          if (reg.projects.some((p) => p.key === proj.key)) continue;
          reg.projects.push(proj);
          const data = parsed.projects[proj.key];
          if (data) saveProjectData(proj.key, data);
        }

        saveRegistry(reg);
        resolve({ success: true, name: parsed.registry.projects[0]?.name });
      } catch (e) {
        resolve({ success: false, error: String(e) });
      }
    };
    reader.readAsText(file);
  });
}
